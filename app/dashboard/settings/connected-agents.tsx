import { ArrowUpRight, BookOpen, Bot } from "lucide-react";
import { headers } from "next/headers";
import CopyButton from "@/components/dashboard/copy-button";
import type { Locale } from "@/lib/i18n";
import { listClients } from "@/lib/oauth";
import RevokeAgentButton from "./revoke-agent-button";

interface ConnectedAgentsProps {
  labels: {
    empty: string;
    connectHelp: string;
    guideLink: string;
    guideHelp: string;
    copy: string;
    copied: string;
    copyFailed: string;
    authorized: string;
    lastUsed: string;
    never: string;
    revoke: string;
    revokeConfirmTitle: string;
    revokeConfirmBody: string;
    revoked: string;
    revokeFailed: string;
    cancel: string;
  };
  locale: Locale;
  dateLocale: string;
  timeZone: string;
}

export default async function ConnectedAgents({
  labels,
  locale,
  dateLocale,
  timeZone,
}: ConnectedAgentsProps) {
  const [clients, headerStore] = await Promise.all([listClients(), headers()]);

  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const mcpUrl = `${proto}://${host}/api/mcp`;
  const guideUrl = `https://threads-analytics.app/${locale}/mcp`;

  const revokeLabels = {
    revoke: labels.revoke,
    revokeConfirmTitle: labels.revokeConfirmTitle,
    revokeConfirmBody: labels.revokeConfirmBody,
    revoked: labels.revoked,
    revokeFailed: labels.revokeFailed,
    cancel: labels.cancel,
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(date);

  return (
    <div className="space-y-4">
      <a
        href={guideUrl}
        target="_blank"
        rel="noreferrer"
        className="bg-muted/40 hover:bg-muted/70 group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-[background-color,scale] duration-150 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <BookOpen className="text-muted-foreground size-4 shrink-0" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="font-medium">{labels.guideLink}</span>{" "}
          <span className="text-muted-foreground">{labels.guideHelp}</span>
        </span>
        <ArrowUpRight className="text-muted-foreground size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-0" />
      </a>

      {clients.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.empty}</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li
              key={client.id}
              className="bg-muted/40 flex items-center gap-3 rounded-xl px-3.5 py-3"
            >
              <Bot className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="text-muted-foreground text-xs">
                  {labels.authorized} {formatDate(client.authorizedAt)} ·{" "}
                  {client.lastUsedAt
                    ? `${labels.lastUsed} ${formatDate(client.lastUsedAt)}`
                    : labels.never}
                </p>
              </div>
              <RevokeAgentButton
                clientId={client.id}
                clientName={client.name}
                labels={revokeLabels}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">{labels.connectHelp}</p>
        <div className="bg-muted/40 flex items-center gap-2 rounded-xl py-1.5 pr-1.5 pl-3.5">
          <code className="min-w-0 flex-1 truncate font-mono text-xs">{mcpUrl}</code>
          <CopyButton
            value={mcpUrl}
            labels={{ copy: labels.copy, copied: labels.copied, failed: labels.copyFailed }}
          />
        </div>
      </div>
    </div>
  );
}

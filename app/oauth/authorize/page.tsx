import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck, ShieldX } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/dashboard/language-switcher";
import { approveAuthorizationAction, denyAuthorizationAction } from "./actions";
import { validateAuthorizeRequest, type AuthorizeParams } from "./validate";

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Duplicated query params arrive as arrays; drop them like the form path does.
  const params: AuthorizeParams = Object.fromEntries(
    Object.entries(await searchParams).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

  if (!(await getSession())) {
    const query = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    redirect(`/login?from=${encodeURIComponent(`/oauth/authorize?${query.toString()}`)}`);
  }

  const { locale, t } = await getDictionary();
  const validated = await validateAuthorizeRequest(params);

  if (validated.status === "error_redirect") redirect(validated.url);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher locale={locale} />
      </div>
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <Image
            src="/threads-analytics-icon.png"
            alt="Threads Analytics icon"
            width={56}
            height={56}
            className="mx-auto rounded-xl"
            priority
          />
          {validated.status === "invalid" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t.oauthConsent.invalidTitle}
              </h1>
              <p className="text-muted-foreground text-sm">{t.oauthConsent.invalidHelp}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{t.oauthConsent.title}</h1>
              <p className="text-muted-foreground text-sm">
                {t.oauthConsent.subtitle.replace("{client}", validated.clientName)}
              </p>
            </>
          )}
        </div>

        {validated.status === "ok" && (
          <>
            <div className="bg-muted/40 space-y-3 rounded-xl p-4 text-sm">
              <p className="font-medium">{t.oauthConsent.scopeTitle}</p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <span>{t.oauthConsent.scopeRead}</span>
              </p>
              <p className="text-muted-foreground flex items-start gap-2">
                <ShieldX className="mt-0.5 size-4 shrink-0" />
                <span>{t.oauthConsent.scopeNoWrite}</span>
              </p>
            </div>

            {/* Client names are self-reported at registration; the redirect
                domain is the one signal the owner can use to spot impostors. */}
            <p className="text-muted-foreground text-center text-xs">
              {t.oauthConsent.redirectNotice.replace(
                "{domain}",
                new URL(validated.redirectUri).host,
              )}
            </p>

            <form className="flex gap-3">
              <input type="hidden" name="client_id" value={validated.clientId} />
              <input type="hidden" name="redirect_uri" value={validated.redirectUri} />
              {validated.state && <input type="hidden" name="state" value={validated.state} />}
              <input type="hidden" name="code_challenge" value={validated.codeChallenge} />
              <input type="hidden" name="scope" value={validated.scope} />
              <Button
                type="submit"
                variant="outline"
                className="flex-1"
                formAction={denyAuthorizationAction}
              >
                {t.oauthConsent.deny}
              </Button>
              <Button type="submit" className="flex-1" formAction={approveAuthorizationAction}>
                {t.oauthConsent.approve}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

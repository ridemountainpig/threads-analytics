import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import LoginForm from "./login-form";
import { getDictionary } from "@/lib/i18n-server";
import LanguageSwitcher from "@/components/dashboard/language-switcher";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const authenticated = await getSession();
  const { from } = await searchParams;
  const redirectTo = sanitizeRedirectPath(from);
  if (authenticated) redirect(redirectTo);
  const { locale, t } = await getDictionary();

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
          <h1 className="text-2xl font-semibold tracking-tight">{t.login.title}</h1>
          <p className="text-muted-foreground text-sm">{t.login.subtitle}</p>
        </div>
        <LoginForm labels={t.login} redirectTo={redirectTo} />
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads Analytics",
  description: "Self-hosted Threads analytics dashboard",
  applicationName: "Threads Analytics",
  appleWebApp: {
    capable: true,
    title: "Threads Analytics",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${GeistSans.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

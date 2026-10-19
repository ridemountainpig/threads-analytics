import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getLocale } from "@/lib/i18n-server";
import { themeColors, themeScript } from "@/lib/theme";
import { getTheme } from "@/lib/theme-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads Analytics",
  description: "Self-hosted Threads analytics dashboard",
  applicationName: "Threads Analytics",
  robots: {
    index: false,
    follow: false,
  },
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

// An explicit choice paints the browser chrome from the first byte; only Auto
// leaves it to the media queries.
export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    themeColor:
      theme === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: themeColors.light },
            { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
          ]
        : themeColors[theme],
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    // The head script adds the theme class before React hydrates.
    <html
      lang={locale}
      className={`${GeistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(theme) }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider initialTheme={theme}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

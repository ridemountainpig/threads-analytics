import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Page Not Found | Threads Analytics",
  description: "The requested Threads Analytics page does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main className="not-found-page">
          <div className="not-found-card">
            <p className="not-found-code">404</p>
            <h1>Page not found</h1>
            <p>找不到這個頁面 · ページが見つかりません</p>
            <div className="not-found-actions">
              <Link className="button button-primary" href="/">
                Go to homepage
              </Link>
              <Link className="button button-secondary" href="/guides">
                Browse guides
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

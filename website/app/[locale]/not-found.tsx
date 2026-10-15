import Link from "next/link";

export default function LocaleNotFound() {
  return (
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
  );
}

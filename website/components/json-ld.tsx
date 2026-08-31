// Rendered via innerHTML so React never treats the tag as a component
// child — avoids the React 19 "script tag while rendering" warning on
// client navigations. JSON-LD is data, not executable code; `<` is escaped
// so the payload can never close the script tag early.
export function JsonLd({ data }: { data: object }) {
  return (
    <div
      hidden
      dangerouslySetInnerHTML={{
        __html: `<script type="application/ld+json">${JSON.stringify(data).replace(
          /</g,
          "\\u003c",
        )}</script>`,
      }}
    />
  );
}

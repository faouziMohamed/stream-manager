/**
 * Structured data. The payload is built from constants in the layout, never
 * from request input; `dangerouslySetInnerHTML` is how Next emits JSON-LD.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}

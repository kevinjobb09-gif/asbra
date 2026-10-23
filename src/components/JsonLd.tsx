/**
 * Strukturerade data (schema.org) för sökmotorer. Innehållet är vår egen data,
 * men "<" ersätts ändå så att texten aldrig kan bryta sig ut ur script-taggen.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

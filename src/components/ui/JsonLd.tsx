export function JsonLd({ json, id }: { json: string; id?: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // Schema.org payload is generated server-side from local content only.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

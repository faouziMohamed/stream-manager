// Flattens a Tiptap JSON document into a single plain-text string,
// for previews/excerpts where rendering full rich text is unnecessary.
export function richTextToPlainText(doc: unknown): string {
  const parts: string[] = [];
  collectText(doc, parts);
  return parts.join(' ').replaceAll(/\s+/g, ' ').trim();
}

function collectText(node: unknown, parts: string[]): void {
  if (node === null || typeof node !== 'object') return;
  const typed = node as { text?: unknown; content?: unknown };
  if (typeof typed.text === 'string') {
    parts.push(typed.text);
  }
  if (Array.isArray(typed.content)) {
    for (const child of typed.content) {
      collectText(child, parts);
    }
  }
}

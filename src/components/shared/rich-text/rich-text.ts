import type { JSONContent } from '@tiptap/react';

export type RichTextValue = JSONContent | null;

export type RichTextPreset = 'full' | 'compact';

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] };

/**
 * Normalises a stored value into Tiptap JSON. Only a Tiptap document is a rich
 * text value; anything else is empty. There is no older format to fall back to.
 */
export function parseRichTextValue(value: unknown): JSONContent {
  return isTiptapDoc(value) ? value : { ...EMPTY_DOC };
}

/** A document is "empty" when it has no visible text content. */
export function isRichTextEmpty(value: unknown): boolean {
  return extractText(parseRichTextValue(value)).trim().length === 0;
}

/** Collapses an empty document to null so blank fields are stored as null. */
export function normaliseRichTextValue(value: unknown): RichTextValue {
  if (isRichTextEmpty(value)) return null;
  return parseRichTextValue(value);
}

function isTiptapDoc(value: unknown): value is JSONContent {
  return typeof value === 'object' && value !== null && (value as JSONContent).type === 'doc';
}

function extractText(node: JSONContent): string {
  let text = node.text ?? '';
  for (const child of node.content ?? []) {
    text += extractText(child);
  }
  return text;
}

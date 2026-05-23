import type {
  RichTextAssetDiff,
  RichTextDocument,
  RichTextNode,
} from '@/components/rich-text/rich-text-types';

export function createRichTextDocumentFromText(text: string): RichTextDocument {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return { type: 'doc', content: [] };

  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph }],
    })),
  };
}

export function diffRichTextAssetPublicIds(previous: unknown, next: unknown): RichTextAssetDiff {
  const previousIds = new Set(extractRichTextAssetPublicIds(previous));
  const nextIds = new Set(extractRichTextAssetPublicIds(next));

  return {
    added: [...nextIds].filter((id) => !previousIds.has(id)).toSorted(),
    removed: [...previousIds].filter((id) => !nextIds.has(id)).toSorted(),
    retained: [...nextIds].filter((id) => previousIds.has(id)).toSorted(),
  };
}

export function extractPlainTextFromRichText(value: unknown): string {
  const document = parseRichTextDocument(value);
  return extractPlainTextFromNode(document).trim();
}

export function extractRichTextAssetPublicIds(value: unknown): string[] {
  const document = parseRichTextDocument(value);
  const ids = new Set<string>();

  collectAssetPublicIds(document.content ?? [], ids);

  return [...ids].toSorted();
}

export function isRichTextDocument(value: unknown): value is RichTextDocument {
  if (!value || typeof value !== 'object') return false;
  const document = value as { content?: unknown; type?: unknown };

  return document.type === 'doc' && document.content === undefined
    ? true
    : document.type === 'doc' && Array.isArray(document.content);
}

export function parseRichTextDocument(value: unknown): RichTextDocument {
  if (isRichTextDocument(value)) return value;
  if (typeof value !== 'string') return { type: 'doc', content: [] };

  const trimmed = value.trim();
  if (!trimmed) return { type: 'doc', content: [] };

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isRichTextDocument(parsed)) return parsed;
  } catch {
    return createRichTextDocumentFromText(trimmed);
  }

  return createRichTextDocumentFromText(trimmed);
}

export function serializeRichTextDocument(value: unknown): string {
  return JSON.stringify(parseRichTextDocument(value));
}

function collectAssetPublicIds(nodes: RichTextNode[], ids: Set<string>) {
  for (const node of nodes) {
    if (node.type === 'image') {
      const publicId = resolveAssetPublicId(node);
      if (publicId) ids.add(publicId);
    }
    if (node.content?.length) collectAssetPublicIds(node.content, ids);
  }
}

function extractPlainTextFromNode(node: RichTextNode | RichTextDocument): string {
  if (node.type === 'text') return node.text ?? '';
  if (!node.content?.length) return '';

  return node.content.map((child) => extractPlainTextFromNode(child)).join(' ');
}

function resolveAssetPublicId(node: RichTextNode): string | null {
  const raw =
    node.attrs?.['data-public-id'] ?? node.attrs?.publicId ?? node.attrs?.public_id ?? null;

  if (typeof raw !== 'string') return null;
  const publicId = raw.trim();

  return publicId.length > 0 ? publicId : null;
}

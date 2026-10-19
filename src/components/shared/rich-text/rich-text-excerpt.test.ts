import { describe, expect, it } from 'vitest';

import { richTextToPlainText } from './rich-text-excerpt';

describe('richTextToPlainText', () => {
  it('flattens nested Tiptap content into a single spaced string', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'world' }] }],
            },
          ],
        },
      ],
    };
    expect(richTextToPlainText(doc)).toBe('Hello world');
  });

  it('collapses whitespace and trims', () => {
    const doc = {
      content: [{ text: '  spaced  ' }, { text: '\n\ttext ' }],
    };
    expect(richTextToPlainText(doc)).toBe('spaced text');
  });

  it('returns an empty string for null, undefined, or non-objects', () => {
    const missing: unknown = undefined;
    expect(richTextToPlainText(null)).toBe('');
    expect(richTextToPlainText(missing)).toBe('');
    expect(richTextToPlainText('plain string')).toBe('');
    expect(richTextToPlainText({ type: 'doc', content: [] })).toBe('');
  });
});

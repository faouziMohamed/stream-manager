import { describe, expect, it } from 'vitest';

import { isRichTextEmpty, normaliseRichTextValue, parseRichTextValue } from './rich-text';

describe('parseRichTextValue', () => {
  it('passes an existing Tiptap doc through unchanged', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    };
    expect(parseRichTextValue(doc)).toBe(doc);
  });

  it('returns an empty doc for null, undefined, and strings', () => {
    for (const value of [null, '', '   ']) {
      expect(parseRichTextValue(value)).toEqual({ type: 'doc', content: [] });
    }
  });
});

describe('isRichTextEmpty', () => {
  it('treats null/undefined/blank as empty', () => {
    const missing = ''.at(99); // string | undefined, resolves to undefined
    expect(isRichTextEmpty(null)).toBe(true);
    expect(isRichTextEmpty(missing)).toBe(true);
    expect(isRichTextEmpty('')).toBe(true);
  });

  it('treats an empty doc as empty', () => {
    expect(isRichTextEmpty({ type: 'doc', content: [] })).toBe(true);
    expect(isRichTextEmpty({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true);
  });

  it('treats a doc with visible text as non-empty', () => {
    expect(
      isRichTextEmpty({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
      })
    ).toBe(false);
  });
});

describe('normaliseRichTextValue', () => {
  it('collapses empty content to null', () => {
    expect(normaliseRichTextValue({ type: 'doc', content: [] })).toBeNull();
    expect(normaliseRichTextValue('')).toBeNull();
  });

  it('keeps non-empty content as a doc', () => {
    const result = normaliseRichTextValue({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'keep' }] }],
    });
    expect(result?.type).toBe('doc');
  });
});

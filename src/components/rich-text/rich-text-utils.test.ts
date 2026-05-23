import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRichTextDocumentFromText,
  diffRichTextAssetPublicIds,
  extractRichTextAssetPublicIds,
  isRichTextDocument,
  parseRichTextDocument,
} from '@/components/rich-text/rich-text-utils';

test('createRichTextDocumentFromText converts plain text paragraphs to Tiptap JSON', () => {
  const document = createRichTextDocumentFromText('Ligne 1\n\nLigne 2');

  assert.deepEqual(document, {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Ligne 1' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Ligne 2' }],
      },
    ],
  });
});

test('parseRichTextDocument accepts JSON strings and legacy plain text', () => {
  const legacy = parseRichTextDocument('Ancienne description');
  const json = parseRichTextDocument(JSON.stringify(legacy));

  assert.ok(isRichTextDocument(legacy));
  assert.deepEqual(json, legacy);
});

test('extractRichTextAssetPublicIds reads image public IDs from nested image nodes', () => {
  const document = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Intro' }],
      },
      {
        type: 'image',
        attrs: {
          src: 'https://res.cloudinary.com/demo/image/upload/v1/streammanager/rich-text/hero',
          'data-public-id': 'streammanager/rich-text/hero',
        },
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'image',
            attrs: {
              publicId: 'streammanager/rich-text/nested',
            },
          },
        ],
      },
    ],
  };

  assert.deepEqual(extractRichTextAssetPublicIds(document), [
    'streammanager/rich-text/hero',
    'streammanager/rich-text/nested',
  ]);
});

test('diffRichTextAssetPublicIds reports added, retained, and removed IDs', () => {
  const previous = createImageDocument(['a', 'b']);
  const next = createImageDocument(['b', 'c']);

  assert.deepEqual(diffRichTextAssetPublicIds(previous, next), {
    added: ['c'],
    retained: ['b'],
    removed: ['a'],
  });
});

function createImageDocument(publicIds: string[]) {
  return {
    type: 'doc',
    content: publicIds.map((publicId) => ({
      type: 'image',
      attrs: { 'data-public-id': publicId },
    })),
  };
}

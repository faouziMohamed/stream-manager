import Link from '@tiptap/extension-link';
import type { Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import type { RichTextPreset } from '@/components/shared/rich-text/rich-text';

// Single source of truth for the rich-text schema, shared by the editor
// (authoring) and the renderer (display) so both stay perfectly in sync.
export function richTextExtensions(preset: RichTextPreset = 'full'): Extensions {
  const isFull = preset === 'full';
  return [
    StarterKit.configure({
      heading: isFull ? { levels: [2, 3] } : false,
    }),
    Link.configure({
      autolink: true,
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
  ] as Extensions;
}

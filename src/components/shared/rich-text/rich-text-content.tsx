'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  isRichTextEmpty,
  parseRichTextValue,
  type RichTextPreset,
} from '@/components/shared/rich-text/rich-text';
import { richTextExtensions } from '@/components/shared/rich-text/rich-text-extensions';

// Renders a Tiptap JSON document as read-only formatted content, using the
// same extension schema as the editor so output matches what was authored.
export function RichTextContent({
  value,
  preset = 'full',
  className,
  fallback = null,
}: {
  value: unknown;
  preset?: RichTextPreset;
  className?: string;
  fallback?: ReactNode;
}) {
  const empty = isRichTextEmpty(value);
  const editor = useEditor(
    {
      editable: false,
      immediatelyRender: false,
      extensions: richTextExtensions(preset),
      content: empty ? '' : parseRichTextValue(value),
      editorProps: {
        attributes: { class: cn('sm-prose text-sm leading-6', className) },
      },
    },
    [value, preset]
  );

  if (empty || editor === null) {
    return fallback;
  }

  return <EditorContent editor={editor} />;
}

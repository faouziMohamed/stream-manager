'use client';

import { EditorContent, type Editor, useEditor } from '@tiptap/react';
import { Bold, Heading2, Heading3, Italic, Link2, Link2Off, List, ListOrdered } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  normaliseRichTextValue,
  parseRichTextValue,
  type RichTextPreset,
  type RichTextValue,
} from '@/components/shared/rich-text/rich-text';
import { richTextExtensions } from '@/components/shared/rich-text/rich-text-extensions';

export function RichTextEditor({
  ariaLabel,
  onChange,
  placeholder,
  preset = 'full',
  value,
}: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const isFull = preset === 'full';

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions(preset),
    content: parseRichTextValue(value),
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? 'Rich text editor',
        class: cn(
          'sm-prose min-h-24 px-3 py-2.5 text-sm leading-6 outline-none',
          isFull && 'min-h-36'
        ),
        ...(placeholder === undefined ? {} : { 'data-placeholder': placeholder }),
      },
    },
    onUpdate: ({ editor: next }) => {
      onChange(normaliseRichTextValue(next.getJSON()));
    },
  });

  if (editor === null) {
    return null;
  }

  function openLinkRow() {
    if (editor === null) return;
    setLinkValue((editor.getAttributes('link').href as string | undefined) ?? '');
    setLinkOpen(true);
  }

  function applyLink() {
    if (editor === null) return;
    const href = linkValue.trim();
    if (href === '') {
      formatChain(editor).focus().unsetLink().run();
    } else {
      formatChain(editor).focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-(--sm-border) bg-(--sm-bg) focus-within:border-(--sm-coral-b) focus-within:ring-2 focus-within:ring-(--sm-coral)/30">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-(--sm-border) bg-(--sm-surface2) px-1.5 py-1">
        {isFull ? (
          <>
            <ToolbarButton
              active={editor.isActive('heading', { level: 2 })}
              label="Heading"
              onClick={() => formatChain(editor).focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('heading', { level: 3 })}
              label="Subheading"
              onClick={() => formatChain(editor).focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="size-3.5" />
            </ToolbarButton>
            <ToolbarDivider />
          </>
        ) : null}

        <ToolbarButton
          active={editor.isActive('bold')}
          label="Bold"
          onClick={() => formatChain(editor).focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          label="Italic"
          onClick={() => formatChain(editor).focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          label="Bullet list"
          onClick={() => formatChain(editor).focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        {isFull ? (
          <ToolbarButton
            active={editor.isActive('orderedList')}
            label="Numbered list"
            onClick={() => formatChain(editor).focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
          </ToolbarButton>
        ) : null}

        <ToolbarDivider />

        <ToolbarButton active={editor.isActive('link')} label="Add link" onClick={openLinkRow}>
          <Link2 className="size-3.5" />
        </ToolbarButton>
        {editor.isActive('link') ? (
          <ToolbarButton
            label="Remove link"
            onClick={() => formatChain(editor).focus().unsetLink().run()}
          >
            <Link2Off className="size-3.5" />
          </ToolbarButton>
        ) : null}
      </div>

      {linkOpen ? (
        <div className="flex items-center gap-2 border-b border-(--sm-border) bg-(--sm-bg) px-2 py-1.5">
          <Input
            autoFocus
            icon={Link2}
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            className="h-8 text-xs"
          />
          <Button type="button" size="sm" variant="accent" onClick={applyLink}>
            Apply
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

export type RichTextEditorProps = {
  ariaLabel?: string;
  onChange: (value: RichTextValue) => void;
  placeholder?: string;
  preset?: RichTextPreset;
  value: unknown;
};

function ToolbarButton({ active = false, children, label, onClick }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        active
          ? 'bg-(--sm-coral-s) text-(--sm-coral) hover:bg-(--sm-coral-s) hover:text-(--sm-coral)'
          : 'text-(--sm-muted) hover:bg-(--sm-surface) hover:text-(--sm-fg)'
      )}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-(--sm-border)" />;
}

// @tiptap 2.27 has a strict-mode regression where StarterKit's bundled command
// augmentations don't widen `ChainedCommands`, so the formatting commands lose
// their types. They exist at runtime — this narrow, local typing restores
// type-safety for exactly the commands this editor uses.
type FormatChain = {
  extendMarkRange: (name: string) => FormatChain;
  focus: () => FormatChain;
  run: () => boolean;
  setLink: (attrs: { href: string }) => FormatChain;
  toggleBold: () => FormatChain;
  toggleBulletList: () => FormatChain;
  toggleHeading: (attrs: { level: number }) => FormatChain;
  toggleItalic: () => FormatChain;
  toggleOrderedList: () => FormatChain;
  unsetLink: () => FormatChain;
};

function formatChain(editor: Editor): FormatChain {
  return editor.chain() as unknown as FormatChain;
}

type ToolbarButtonProps = {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
};

'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { RichTextPreset } from '@/components/rich-text/rich-text-types';

export function RichTextToolbar({
  editor,
  onImageClick,
  onLinkClick,
  preset,
}: RichTextToolbarProps) {
  const isMarketing = preset === 'marketing';

  return (
    <div className="bg-muted/35 flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <ToolbarButton label="Annuler" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      {isMarketing && (
        <>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            label="Titre"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            label="Sous-titre"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarSeparator />
        </>
      )}
      <ToolbarButton
        active={editor.isActive('bold')}
        label="Gras"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        label="Italique"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        label="Souligné"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton label="Liste" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Liste numérotée"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Citation"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Lien" onClick={onLinkClick}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      {isMarketing && (
        <>
          <ToolbarButton
            label="Surligner"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={onImageClick}>
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

type RichTextToolbarProps = {
  editor: Editor;
  onImageClick: () => void;
  onLinkClick: () => void;
  preset: RichTextPreset;
};

type ToolbarButtonProps = {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
};

function ToolbarButton({ active, children, label, onClick }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'default' : 'ghost'}
      title={label}
      aria-label={label}
      onClick={onClick}
      className="h-7 w-7"
    >
      {children}
    </Button>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-0.5 h-5" />;
}

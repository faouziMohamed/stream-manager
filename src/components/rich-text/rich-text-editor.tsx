'use client';

import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, type JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';

import { RichTextImage } from '@/components/rich-text/extensions/rich-text-image';
import { RichTextToolbar } from '@/components/rich-text/rich-text-toolbar';
import type { RichTextDocument, RichTextPreset } from '@/components/rich-text/rich-text-types';
import { parseRichTextDocument } from '@/components/rich-text/rich-text-utils';
import { useUploadRichTextAsset } from '@/modules/rich-text/client/queries/use-rich-text-assets.queries';
import { clientLogger } from '@/lib/logger/client-logger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const logger = clientLogger('rich-text-editor');

export function RichTextEditor({
  className,
  onAssetUploaded,
  onChange,
  placeholder,
  preset,
  value,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const uploadAsset = useUploadRichTextAsset();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Underline,
      Highlight,
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      RichTextImage,
      Placeholder.configure({ placeholder }),
    ],
    content: parseRichTextDocument(value) as JSONContent,
    editorProps: {
      attributes: {
        class: 'rich-text-prose min-h-[150px] px-3 py-2.5 text-sm leading-6 outline-none',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getJSON() as RichTextDocument);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(parseRichTextDocument(value));
    const current = JSON.stringify(editor.getJSON());
    if (incoming !== current) editor.commands.setContent(JSON.parse(incoming) as JSONContent);
  }, [editor, value]);

  async function handleImageSelected(file: File) {
    const base64 = await readFileAsBase64(file);
    const result = await uploadAsset.mutateAsync({ base64, filename: file.name });
    if (!result.success || !result.asset) return;

    const imageAttrs = {
      src: result.asset.url,
      alt: file.name,
      'data-public-id': result.asset.publicId,
    };

    editor?.chain().focus().setImage(imageAttrs).run();
    onAssetUploaded?.(result.asset.publicId);
  }

  function handleLinkClick() {
    const currentHref = editor?.getAttributes('link').href as string | undefined;
    setLinkValue(currentHref ?? '');
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    if (!linkValue.trim()) {
      editor.chain().focus().unsetLink().run();
      setLinkOpen(false);
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkValue.trim() }).run();
    setLinkOpen(false);
  }

  return (
    <div className={className}>
      <div className="rich-text-editor bg-background overflow-hidden rounded-md border">
        {editor && (
          <RichTextToolbar
            editor={editor}
            preset={preset}
            onImageClick={() => fileInputRef.current?.click()}
            onLinkClick={handleLinkClick}
          />
        )}
        <EditorContent editor={editor} />
      </div>
      {preset === 'marketing' && (
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            handleImageSelected(file).catch((error: unknown) => {
              logger.error('Image upload failed', error);
            });
          }}
        />
      )}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
          </DialogHeader>
          <Input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://exemple.com"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={applyLink}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type RichTextEditorProps = {
  className?: string;
  onAssetUploaded?: (publicId: string) => void;
  onChange: (value: RichTextDocument) => void;
  placeholder?: string;
  preset: RichTextPreset;
  value: unknown;
};

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

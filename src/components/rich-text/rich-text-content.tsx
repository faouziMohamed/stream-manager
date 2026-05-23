import type { JSX, ReactNode } from 'react';

import { isRichTextDocument, parseRichTextDocument } from '@/components/rich-text/rich-text-utils';
import type { RichTextNode } from '@/components/rich-text/rich-text-types';
import { cn } from '@/lib/utils';

export function RichTextContent({ className, value }: RichTextContentProps) {
  const document = parseRichTextDocument(value);
  if (!isRichTextDocument(document) || !hasRenderableContent(document.content)) return null;

  return (
    <div className={cn('rich-text-rendered text-sm leading-6', className)}>
      {document.content?.map((node, index) => renderNode(node, `node-${index}`))}
    </div>
  );
}

type RichTextContentProps = {
  className?: string;
  value: unknown;
};

function renderNode(node: RichTextNode, key: string): ReactNode {
  switch (node.type) {
    case 'text': {
      return <span key={key}>{renderText(node, key)}</span>;
    }
    case 'paragraph': {
      return <p key={key}>{renderChildren(node, key)}</p>;
    }
    case 'heading': {
      return renderHeading(node, key);
    }
    case 'bulletList': {
      return <ul key={key}>{renderChildren(node, key)}</ul>;
    }
    case 'orderedList': {
      return <ol key={key}>{renderChildren(node, key)}</ol>;
    }
    case 'listItem': {
      return <li key={key}>{renderChildren(node, key)}</li>;
    }
    case 'blockquote': {
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
    }
    case 'hardBreak': {
      return <br key={key} />;
    }
    case 'horizontalRule': {
      return <hr key={key} />;
    }
    case 'image': {
      return renderImage(node, key);
    }
    default: {
      return <span key={key}>{renderChildren(node, key)}</span>;
    }
  }
}

function renderText(node: RichTextNode, key: string): ReactNode {
  const text = node.text ?? '';
  if (!node.marks?.length) return text;

  return node.marks.reduce<ReactNode>((child, mark, index) => {
    const markKey = `${key}-mark-${index}`;
    if (mark.type === 'bold') return <strong key={markKey}>{child}</strong>;
    if (mark.type === 'italic') return <em key={markKey}>{child}</em>;
    if (mark.type === 'underline') return <u key={markKey}>{child}</u>;
    if (mark.type === 'strike') return <s key={markKey}>{child}</s>;
    if (mark.type === 'link') return renderLink(mark.attrs?.href, child, markKey);
    if (mark.type === 'highlight') {
      return (
        <mark key={markKey} className="rounded bg-amber-100 px-1 text-amber-950">
          {child}
        </mark>
      );
    }
    return child;
  }, text);
}

function renderHeading(node: RichTextNode, key: string) {
  const level = Math.min(3, Math.max(2, Number(node.attrs?.level ?? 2) || 2));
  const tag = `h${level}` as keyof JSX.IntrinsicElements;
  const children = renderChildren(node, key);

  if (tag === 'h2') return <h2 key={key}>{children}</h2>;
  return <h3 key={key}>{children}</h3>;
}

function renderImage(node: RichTextNode, key: string) {
  const src = resolveSafeImageSrc(node.attrs?.src);
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Rich text images come from dynamic Cloudinary content.
    <img
      key={key}
      src={src}
      alt={typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''}
      className="my-3 h-auto max-w-full rounded-md border"
      loading="lazy"
    />
  );
}

function renderChildren(node: RichTextNode, key: string) {
  return node.content?.map((child, index) => renderNode(child, `${key}-${index}`));
}

function renderLink(href: unknown, child: ReactNode, key: string) {
  const safeHref = resolveSafeHref(href);
  if (!safeHref) return child;

  return (
    <a key={key} href={safeHref} target="_blank" rel="noopener noreferrer">
      {child}
    </a>
  );
}

function hasRenderableContent(nodes?: RichTextNode[]): boolean {
  return Boolean(
    nodes?.some(
      (node) =>
        node.text?.trim() ||
        node.type === 'horizontalRule' ||
        (node.type === 'image' && resolveSafeImageSrc(node.attrs?.src)) ||
        hasRenderableContent(node.content)
    )
  );
}

function resolveSafeHref(href: unknown) {
  if (typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveSafeImageSrc(src: unknown) {
  if (typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (/^(https?:|\/|data:image\/)/i.test(trimmed)) return trimmed;
  return null;
}

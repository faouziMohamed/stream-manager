export function renderTipTapToHtml(json: unknown): string {
  const doc = json as TiptapNode;

  if (doc.type !== 'doc') {
    return '';
  }

  return renderContent(doc);
}

export function renderTipTapToPlainText(json: unknown): string {
  const doc = json as TiptapNode;

  if (doc.type !== 'doc') {
    return '';
  }

  return extractText(doc).trim();
}

const MARK_STYLES: Record<string, (attrs?: Record<string, unknown>) => MarkStyle> = {
  bold: () => ({ open: '<strong>', close: '</strong>' }),
  code: () => ({
    close: '</code>',
    open: '<code style="background:#f4f4f4;padding:2px 4px;border-radius:3px;font-family:monospace;font-size:0.9em">',
  }),
  italic: () => ({ open: '<em>', close: '</em>' }),
  link: (attrs?: Record<string, unknown>) => {
    const href = String(attrs?.href ?? '');
    return {
      close: '</a>',
      open: `<a href="${escapeAttr(href)}" style="color:#0066cc;text-decoration:underline">`,
    };
  },
  strike: () => ({
    close: '</s>',
    open: '<s style="text-decoration:line-through">',
  }),
  subscript: () => ({ open: '<sub>', close: '</sub>' }),
  superscript: () => ({ open: '<sup>', close: '</sup>' }),
  textStyle: (attrs?: Record<string, unknown>) => {
    const styles: string[] = [];

    if (attrs?.fontFamily !== undefined && attrs.fontFamily !== null) {
      styles.push(`font-family:${String(attrs.fontFamily)}`);
    }

    if (attrs?.fontSize !== undefined && attrs.fontSize !== null) {
      styles.push(`font-size:${String(attrs.fontSize)}`);
    }

    if (attrs?.color !== undefined && attrs.color !== null) {
      styles.push(`color:${String(attrs.color)}`);
    }

    const style = styles.join(';');

    if (style.length === 0) {
      return { open: '', close: '' };
    }

    return {
      close: '</span>',
      open: `<span style="${style}">`,
    };
  },
  underline: () => ({
    close: '</u>',
    open: '<u style="text-decoration:underline">',
  }),
};

const NODE_RENDERERS: Record<string, (node: TiptapNode) => string> = {
  blockquote: (node) => {
    const inner = renderContent(node);

    return `<blockquote style="margin:0 0 10px;padding:10px 15px;border-left:3px solid #ddd;color:#666">${inner}</blockquote>`;
  },
  bulletList: (node) => {
    const inner = renderContent(node);

    return `<ul style="margin:0 0 10px;padding-left:20px">${inner}</ul>`;
  },
  codeBlock: (node) => {
    const inner = renderContent(node);

    return `<pre style="background:#f4f4f4;padding:10px;border-radius:4px;overflow-x:auto;font-family:monospace;font-size:0.9em"><code>${inner}</code></pre>`;
  },
  doc: (node) => renderContent(node),
  hardBreak: () => '<br>',
  heading: (node) => {
    const level = (node.attrs?.level as number) ?? 1;
    const tag = Math.min(Math.max(level, 1), 6);
    const sizes: Record<number, string> = {
      1: 'font-size:24px;font-weight:bold;margin:0 0 10px',
      2: 'font-size:20px;font-weight:bold;margin:0 0 10px',
      3: 'font-size:18px;font-weight:bold;margin:0 0 8px',
      4: 'font-size:16px;font-weight:bold;margin:0 0 8px',
      5: 'font-size:14px;font-weight:bold;margin:0 0 6px',
      6: 'font-size:13px;font-weight:bold;margin:0 0 6px',
    };
    const inner = renderContent(node);

    return `<h${tag} style="${sizes[tag]}">${inner}</h${tag}>`;
  },
  horizontalRule: () => '<hr style="border:none;border-top:1px solid #ccc;margin:15px 0">',
  listItem: (node) => {
    const inner = renderContent(node);

    return `<li style="margin-bottom:5px">${inner}</li>`;
  },
  orderedList: (node) => {
    const inner = renderContent(node);

    return `<ol style="margin:0 0 10px;padding-left:20px">${inner}</ol>`;
  },
  paragraph: (node) => {
    const inner = renderContent(node);

    return `<p style="margin:0 0 10px;line-height:1.6">${inner}</p>`;
  },
  text: (node) => {
    let text = escapeHtml(node.text ?? '');

    if (node.marks !== undefined) {
      for (const mark of node.marks) {
        const styler = MARK_STYLES[mark.type];

        if (styler !== undefined) {
          const style = styler(mark.attrs);
          text = `${style.open}${text}${style.close}`;
        }
      }
    }

    return text;
  },
};

function renderContent(node: TiptapNode): string {
  if (node.content === undefined || node.content.length === 0) {
    return '';
  }

  return node.content.map((child) => renderNode(child)).join('');
}

function renderNode(node: TiptapNode): string {
  const renderer = NODE_RENDERERS[node.type];

  if (renderer === undefined) {
    return renderContent(node);
  }

  return renderer(node);
}

function escapeAttr(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function extractText(node: TiptapNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (node.content === undefined || node.content.length === 0) {
    if (node.type === 'hardBreak' || node.type === 'horizontalRule') {
      return '\n';
    }

    return '';
  }

  return node.content
    .map((child) => extractText(child))
    .join(node.type === 'paragraph' || node.type === 'heading' ? '\n' : '');
}

interface TiptapNode {
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
  type: string;
}

interface TiptapMark {
  attrs?: Record<string, unknown>;
  type: string;
}

interface MarkStyle {
  open: string;
  close: string;
}

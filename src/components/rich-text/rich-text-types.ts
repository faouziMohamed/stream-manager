export type RichTextAttrs = Record<string, unknown>;

export type RichTextMark = {
  attrs?: RichTextAttrs;
  type?: string;
};

export type RichTextNode = {
  attrs?: RichTextAttrs;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
  type?: string;
};

export type RichTextDocument = {
  content?: RichTextNode[];
  type: 'doc';
};

export type RichTextPreset = 'internal' | 'marketing';

export type RichTextAssetDiff = {
  added: string[];
  removed: string[];
  retained: string[];
};

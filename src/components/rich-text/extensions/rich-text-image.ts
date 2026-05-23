import Image from '@tiptap/extension-image';

export const RichTextImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-public-id': {
        default: null,
        parseHTML: (element) => element.dataset.publicId,
        renderHTML: (attributes: { 'data-public-id'?: string | null }) => {
          if (!attributes['data-public-id']) return {};
          return { 'data-public-id': attributes['data-public-id'] };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => Number.parseInt(element.getAttribute('width') ?? '', 10) || null,
        renderHTML: (attributes: { width?: number | null }) => {
          if (!attributes.width) return {};
          return { width: String(attributes.width) };
        },
      },
    };
  },
}).configure({
  allowBase64: false,
  inline: false,
  HTMLAttributes: {
    class: 'rich-text-image',
  },
});

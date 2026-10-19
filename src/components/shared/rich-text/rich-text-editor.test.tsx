// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RichTextEditor } from './rich-text-editor';

describe('RichTextEditor', () => {
  it('mounts and renders the full toolbar', async () => {
    render(<RichTextEditor preset="full" value={null} onChange={vi.fn()} />);

    expect(await screen.findByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading')).toBeInTheDocument();
    expect(screen.getByLabelText('Numbered list')).toBeInTheDocument();
  });

  it('hides heading and numbered-list controls in the compact preset', async () => {
    render(<RichTextEditor preset="compact" value={null} onChange={vi.fn()} />);

    expect(await screen.findByLabelText('Bold')).toBeInTheDocument();
    expect(screen.queryByLabelText('Heading')).toBeNull();
    expect(screen.queryByLabelText('Numbered list')).toBeNull();
  });
});

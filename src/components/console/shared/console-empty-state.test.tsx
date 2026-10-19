// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConsoleEmptyState } from './console-empty-state';

describe('ConsoleEmptyState', () => {
  it('renders the title and optional description', () => {
    render(<ConsoleEmptyState title="No data" description="Nothing here yet" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('is bordered by default and can opt out for in-table usage', () => {
    const { container, rerender } = render(<ConsoleEmptyState title="Empty" />);
    expect(container.firstChild).toHaveClass('border-dashed');

    rerender(<ConsoleEmptyState title="Empty" bordered={false} />);
    expect(container.firstChild).not.toHaveClass('border-dashed');
  });
});

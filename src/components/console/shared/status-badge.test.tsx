// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders its label', () => {
    render(<StatusBadge tone="positive">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies the tone-specific token classes', () => {
    render(<StatusBadge tone="critical">Overdue</StatusBadge>);
    // The badge text tone is `-t`, measured at >= 4.5:1 on its own fill; the
    // brand tone it replaced only reached 4.02:1 in dark and 3.74:1 in light.
    expect(screen.getByText('Overdue').className).toContain('text-(--sm-coral-t)');
  });

  it('keeps the shared pill shape and merges custom classes', () => {
    render(
      <StatusBadge tone="neutral" className="ml-2">
        Archived
      </StatusBadge>
    );
    const badge = screen.getByText('Archived');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('uppercase');
    expect(badge.className).toContain('ml-2');
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button accent variant', () => {
  it('renders the unified coral accent treatment', () => {
    render(<Button variant="accent">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('bg-(--sm-coral)');
    expect(button.className).toContain('text-(--sm-coral-fg)');
  });

  it('still honours explicit size and extra classes', () => {
    render(
      <Button variant="accent" size="sm" className="w-full">
        Record payment
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Record payment' });
    expect(button.className).toContain('w-full');
  });
});

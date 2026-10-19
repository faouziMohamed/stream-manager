// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmActionDialog } from './confirm-action-dialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmActionDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onOpenChangeAction = vi.fn();

  render(
    <ConfirmActionDialog
      confirmLabel="Renew"
      description="The membership will extend by its plan term."
      icon={<span aria-hidden="true">icon</span>}
      onConfirm={onConfirm}
      onOpenChangeAction={onOpenChangeAction}
      open
      title="Renew this membership?"
      {...overrides}
    />
  );

  return { onConfirm, onOpenChangeAction };
}

describe('ConfirmActionDialog', () => {
  it('only runs the action from the confirm button', async () => {
    const { onConfirm } = renderDialog();

    expect(screen.getByText('Renew this membership?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Renew' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes without running the action on cancel', async () => {
    const { onConfirm, onOpenChangeAction } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChangeAction.mock.calls[0]?.[0]).toBe(false);
  });

  it('disables both actions while the mutation is pending', () => {
    renderDialog({ pending: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  });
});

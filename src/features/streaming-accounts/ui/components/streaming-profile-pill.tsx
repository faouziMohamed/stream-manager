'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ProfilePillProps = {
  name: string;
  onEditAction: (name: string) => void;
  onDeleteAction: () => void;
  /** Accountants can read profiles but not rename or delete them. */
  readOnly?: boolean;
};

export function ProfilePill({
  name,
  onEditAction,
  onDeleteAction,
  readOnly = false,
}: ProfilePillProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  if (editing) {
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim().length > 0) {
            onEditAction(value.trim());
            setEditing(false);
          }
        }}
      >
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 w-28 rounded-full px-2.5 text-[10px]"
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setValue(name);
              setEditing(false);
            }
          }}
        />
      </form>
    );
  }

  return (
    <div className="group flex items-center gap-0.5 rounded-full border border-(--sm-border) bg-(--sm-bg) px-2.5 py-1">
      <span className="text-[10px] font-semibold text-(--sm-muted)">{name}</span>
      {readOnly ? null : (
        <>
          <Button
            type="button"
            variant="ghost"
            className="ml-1 hidden size-5 items-center justify-center rounded p-0.5 text-(--sm-muted) group-hover:flex hover:text-(--sm-fg)"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-2.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="hover:text-destructive hidden size-5 items-center justify-center rounded p-0.5 text-(--sm-muted) group-hover:flex"
            onClick={onDeleteAction}
          >
            <Trash2 className="size-2.5" />
          </Button>
        </>
      )}
    </div>
  );
}

'use client';

import type { ReactElement } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A hover/focus label for controls that show only an icon.
 *
 * The trigger renders *as* the child rather than wrapping it: a wrapper with
 * `display: contents` generates no box, so the positioner has no rect to
 * anchor against and the tooltip lands at the top-left of the viewport.
 */
export function WithTooltip({ children, label }: WithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type WithTooltipProps = {
  children: ReactElement;
  label: string;
};

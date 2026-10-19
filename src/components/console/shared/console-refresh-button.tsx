'use client';

import { useState } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';

export function ConsoleRefreshButton({ ariaLabel, queryKey }: ConsoleRefreshButtonProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await queryClient.refetchQueries({ queryKey, type: 'active' });
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <WithTooltip label={ariaLabel}>
      <Button
        aria-label={ariaLabel}
        className="shrink-0"
        disabled={isRefreshing}
        onClick={() => void handleRefresh()}
        size="icon-sm"
        variant="outline"
      >
        <RefreshCw className={isRefreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
      </Button>
    </WithTooltip>
  );
}

type ConsoleRefreshButtonProps = {
  ariaLabel: string;
  queryKey: QueryKey;
};

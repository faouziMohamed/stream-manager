'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { QueryClientProviderProps } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { toast } from 'sonner';

const FALLBACK_ERROR_MESSAGE = 'The operation could not be completed. Please try again.';

export function createQueryClient(
  notifyFailure: OperationFailureNotifier = notifyOperationFailure
) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => notifyFailure(getOperationErrorMessage(error)),
    }),
    queryCache: new QueryCache({
      onError: (error) => notifyFailure(getOperationErrorMessage(error)),
    }),
  });
}

export function getOperationErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return FALLBACK_ERROR_MESSAGE;

  // Prefer a clean GraphQL error message embedded in the transport payload.
  const graphQlMessage = extractGraphQlMessage(error.message);
  if (graphQlMessage !== null && isUserFacingMessage(graphQlMessage)) {
    return graphQlMessage;
  }

  // Otherwise only surface the raw message if it is already human-readable;
  // never leak transport dumps (status codes, JSON bodies, query/variables).
  const message = error.message.trim();
  if (isUserFacingMessage(message)) {
    return message;
  }

  return FALLBACK_ERROR_MESSAGE;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(createQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function extractGraphQlMessage(message: string): string | null {
  const match = message.match(/"message"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

// A message is safe to display only when it reads like a sentence — not a raw
// transport dump (graphql-request prefixes, JSON bodies, or generic 5xx text).
function isUserFacingMessage(message: string): boolean {
  if (message.length === 0 || message.length > 200) return false;
  if (message === 'Internal server error') return false;
  if (message.includes('{') || message.includes('"')) return false;
  if (/graphql error \(code:/i.test(message)) return false;
  return true;
}

function notifyOperationFailure(message: string) {
  toast.error('Operation failed', {
    description: message,
  });
}

type QueryProviderProps = Omit<QueryClientProviderProps, 'client'>;
type OperationFailureNotifier = (message: string) => void;

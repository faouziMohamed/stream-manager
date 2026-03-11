"use client";

import { toast } from "sonner";
import { clientLogger } from "@/lib/logger/client-logger";

const logger = clientLogger("toast");

interface GqlError {
  message: string;
  extensions?: { code?: string };
}

interface ClientError {
  response?: { errors?: GqlError[] };
  message?: string;
}

/**
 * Extract the most useful message from a GraphQL ClientError.
 * - VALIDATION_ERROR  → show the server message verbatim (it's already user-friendly)
 * - FORBIDDEN         → fixed French message
 * - NOT_FOUND         → fixed French message
 * - anything else     → generic fallback
 */
function extractMessage(err: unknown): string {
  const clientErr = err as ClientError;
  const errors = clientErr?.response?.errors;

  if (errors && errors.length > 0) {
    const first = errors[0]!;
    const code = first.extensions?.code;

    if (code === "VALIDATION_ERROR") return first.message;
    if (code === "FORBIDDEN") return "Action non autorisée.";
    if (code === "NOT_FOUND") return "Ressource introuvable.";
    // Surface unexpected server messages for non-production ease
    if (first.message && first.message !== "Unexpected error.")
      return first.message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

/**
 * Call inside React Query `onError` callbacks.
 * Fires a sonner error toast + logs to the server via clientLogger.
 */
export function toastError(err: unknown, context?: string): void {
  const message = extractMessage(err);
  toast.error(message, {
    description: context ?? undefined,
    duration: 6000,
  });
  logger.error(
    context ?? "mutation error",
    err instanceof Error ? err : new Error(String(err)),
  );
}

/**
 * Success toast — use sparingly (only for non-obvious operations).
 */
export function toastSuccess(message: string, description?: string): void {
  toast.success(message, { description, duration: 3000 });
}

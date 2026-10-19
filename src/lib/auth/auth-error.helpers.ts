const authRecoveryCodes = new Set(['TOKEN_EXPIRED', 'UNAUTHENTICATED']);

export function isExpiredTokenError(error: unknown): boolean {
  return getErrorCodes(error).includes('TOKEN_EXPIRED');
}

export function isAuthRecoveryFailure(error: unknown): boolean {
  return getErrorCodes(error).some((code) => authRecoveryCodes.has(code));
}

// Machine-readable `extensions.code` values from a GraphQL error (direct or
// inside `response.errors`); empty when the error carries none (network, 429).
export function getAuthErrorCodes(error: unknown): string[] {
  return getErrorCodes(error);
}

function getErrorCodes(error: unknown): string[] {
  if (!isRecord(error)) {
    return [];
  }

  const directCode = getStringCode(error);
  const response = error.response;

  if (!isRecord(response)) {
    return directCode === null ? [] : [directCode];
  }

  const errors = response.errors;

  if (!Array.isArray(errors)) {
    return directCode === null ? [] : [directCode];
  }

  const codes = errors.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const code = getStringCode(entry);
    return code === null ? [] : [code];
  });

  return directCode === null ? codes : [directCode, ...codes];
}

function getStringCode(error: Record<string, unknown>): string | null {
  const extensions = error.extensions;

  if (!isRecord(extensions) || typeof extensions.code !== 'string') {
    return null;
  }

  return extensions.code;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

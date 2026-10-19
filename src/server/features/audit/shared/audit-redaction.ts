const SECRET_KEY = /password|passwd|pin|token|secret|authorization|api[_-]?key|credential/i;

const MAX_DEPTH = 6;
const MAX_STRING = 2000;

/**
 * What may be written to the audit trail.
 *
 * Variables are stored so an event can be read without joining the domain
 * tables, which means anything secret in them would become permanent: the
 * account password, a profile PIN, a session token, a reset secret. Keys that
 * name a secret are replaced wholesale; long strings are truncated so one
 * pasted document cannot bloat the row. Files are recorded as a marker, never
 * serialized.
 */
export function redactAuditValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }

  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    if (depth >= MAX_DEPTH) return '[truncated]';
    if (Array.isArray(value)) return value.map((item) => redactAuditValue(item, depth + 1));

    // Uploads arrive as a File/Blob; its contents are not audit data.
    const constructorName = (value as { constructor?: { name?: string } }).constructor?.name;

    if (constructorName === 'File' || constructorName === 'Blob') return '[file]';

    const redacted: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      redacted[key] = SECRET_KEY.test(key) ? '[redacted]' : redactAuditValue(item, depth + 1);
    }

    return redacted;
  }

  return String(value);
}

// ── Subscription statuses ─────────────────────────────────────────────────────
export const subscriptionStatusColor: Record<string, string> = {
  active:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  expired:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400',
  paused:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
};

export const subscriptionStatusLabel: Record<string, string> = {
  active: 'Actif',
  expired: 'Expiré',
  paused: 'Suspendu',
  cancelled: 'Annulé',
};

// ── Payment statuses ───────────────────────────────────────────────────────────
export const paymentStatusColor: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  unpaid:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400',
  overdue: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
};

export const paymentStatusLabel: Record<string, string> = {
  paid: 'Payé',
  unpaid: 'En attente',
  overdue: 'En retard',
};

/** Full-row highlight for overdue rows */
export const overdueRowClass = 'bg-red-50/50 dark:bg-red-950/20';

/**
 * Returns a Tailwind text-color class based on how many days until expiry.
 * Negative = already expired (red bold), 0-7 = red, 8-30 = amber, else muted.
 */
export function expiryClass(daysUntil: number): string {
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 font-semibold';
  if (daysUntil <= 7) return 'text-red-600 dark:text-red-400 font-medium';
  if (daysUntil <= 30) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-muted-foreground';
}

/** Returns a concise human label for days-until value */
export function expiryLabel(daysUntil: number): string {
  if (daysUntil < 0) return `Expiré il y a ${Math.abs(daysUntil)}j`;
  if (daysUntil === 0) return "Expire aujourd'hui";
  if (daysUntil <= 7) return `Expire dans ${daysUntil}j`;
  return '';
}


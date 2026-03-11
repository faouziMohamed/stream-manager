/**
 * Centralised chart colour palette for Recharts across the whole platform.
 * Uses vivid, distinct colours that work on both light and dark backgrounds.
 */

// ── Categorical palette (bars, lines, pies — one colour per series) ───────────
export const CHART_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ec4899", // pink
  "#f97316", // orange
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#ef4444", // red
  "#84cc16", // lime
] as const;

// ── Semantic colours (always used for the same meaning) ───────────────────────
export const CHART_SEMANTIC = {
  revenue: "#6366f1", // indigo  — revenue / paid line
  paid: "#10b981", // emerald — paid payments
  unpaid: "#f59e0b", // amber   — pending payments
  overdue: "#ef4444", // red     — overdue payments
  clients: "#3b82f6", // blue    — clients
  active: "#10b981", // emerald — active subscriptions
  upcoming: "#f97316", // orange  — upcoming due
} as const;

/** Pick a colour from the categorical palette by index (cycles). */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

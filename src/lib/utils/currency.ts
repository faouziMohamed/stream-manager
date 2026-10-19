/**
 * The currency a figure is shown in when nothing else names one.
 *
 * Today every plan and payment is MAD, but that is a fact about the data, not
 * about the code: a plan carries its own `currencyCode`, and this constant is
 * only the fallback for sums that have no single row behind them (a monthly
 * revenue total, a chart axis). It reads `NEXT_PUBLIC_DEFAULT_CURRENCY` so the
 * deployment decides, and defaults to MAD so a missing variable is still a
 * working console rather than a crash.
 *
 * Client-safe on purpose: `process.env.NEXT_PUBLIC_*` is inlined at build
 * time, so importing this from a client component does not pull server code
 * into the bundle.
 */
export const DEFAULT_CURRENCY = (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'MAD')
  .trim()
  .toUpperCase();

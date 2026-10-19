/**
 * One tooltip skin for every chart on the console.
 *
 * Recharts colours the item rows with a grey it hard-codes against a white
 * background; on the dark surface it sat at roughly 2:1 and read as invisible.
 * `contentStyle` alone does not fix it — the label, the item text and the
 * border are three separate props, and each chart had set only some of them.
 * They are defined once here so a new chart cannot inherit the bug again.
 */
export const CHART_TOOLTIP_STYLE = {
  background: 'var(--sm-surface)',
  border: '1px solid var(--sm-border2)',
  borderRadius: 8,
  color: 'var(--sm-fg)',
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  color: 'var(--sm-fg)',
  fontWeight: 600,
} as const;

export const CHART_TOOLTIP_ITEM_STYLE = {
  color: 'var(--sm-fg)',
} as const;

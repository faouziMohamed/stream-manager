---
name: StreamManager
description: Dark-first operations console for streaming-subscription resellers; coral identity, quiet surfaces, colour reserved for state and named actions.
colors:
  void: 'oklch(0.12 0.012 262)'
  bg: 'oklch(0.14 0.012 262)'
  surface: 'oklch(0.16 0.012 262)'
  surface2: 'oklch(0.2 0.01 262)'
  hover: 'oklch(0.27 0.012 262)'
  active: 'oklch(0.32 0.014 262)'
  focus: 'oklch(0.62 0.22 28)'
  border: 'oklch(1 0 0 / 0.08)'
  border2: 'oklch(1 0 0 / 0.14)'
  fg: 'oklch(0.94 0.004 80)'
  muted: 'oklch(0.63 0.01 260)'
  coral: 'oklch(0.62 0.22 28)'
  gold: 'oklch(0.76 0.16 62)'
  emerald: 'oklch(0.72 0.17 157)'
  indigo: 'oklch(0.58 0.18 255)'
  violet: 'oklch(0.68 0.2 309)'
typography:
  display:
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 600
    letterSpacing: '-0.025em'
  section:
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 600
  body:
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
  supporting:
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
  micro:
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.6875rem'
    textTransform: 'uppercase'
  numeric:
    fontFamily: 'Geist Mono, SFMono-Regular, Consolas, monospace'
    fontVariantNumeric: 'tabular-nums'
rounded:
  base: '0.625rem'
  control: 'var(--radius-md)'
  panel: 'var(--radius-xl)'
  pill: '9999px'
spacing:
  control-gap: '0.375rem'
  field-gap: '1rem'
  panel-inset: '1.25rem'
  section-gap: '1.5rem'
components:
  panel:
    backgroundColor: '{colors.surface}'
    border: '1px solid {colors.border}'
    rounded: '{rounded.panel}'
    padding: '{spacing.panel-inset}'
  control:
    backgroundColor: 'transparent'
    border: '1px solid {colors.border}'
    rounded: '{rounded.control}'
    height: '2.5rem'
  focus-ring:
    outline: '2px solid {colors.focus}'
    outlineOffset: '2px'
---

# Design System: StreamManager

## Overview

**Creative north star: the operator's ledger.**

This is a back-office console for reselling streaming subscriptions in Morocco.
The person using it is reconciling money and access — who paid, who is due,
which profile belongs to whom. Every decision below serves reading that state
quickly and being certain of it.

The surface is dark and near-neutral so the only saturated things on screen are
the ones carrying meaning. Coral is the single brand voice; gold, emerald and
indigo exist to name a state, never to decorate.

Recorded 2026-10-17 from the shipped implementation: `src/app/globals.css`,
`src/components/ui/`, `src/components/console/`. Values in the frontmatter are
the dark theme, which is the default; the light theme mirrors every token.

## Colors

### Surfaces

Six steps, deliberately close together: `void` → `bg` → `surface` → `surface2`
→ `hover` → `active`. The page sits on `bg`, panels on `surface`, inset rows on
`surface2`.

`hover` and `active` are their own tokens and must not be substituted with
`surface2`. They were the same value once, and at one lightness step above the
panel the hover state was invisible — the whole console read as inert.

### Accents

Each accent ships four roles, and they are not interchangeable:

| Suffix   | Role                                                      |
| -------- | --------------------------------------------------------- |
| _(none)_ | the solid fill — buttons, chart strokes, the selected day |
| `-s`     | the soft fill behind a badge or chip                      |
| `-b`     | the border around that fill                               |
| `-t`     | **text** sitting on the matching `-s` fill                |

`-t` exists because the brand tone fails as text. Measured on its own fill, the
badge label came in at 4.02:1 in dark and 2.62–4.41:1 in light, under the 4.5:1
normal text requires. The `-t` tones were solved to the minimum lightness that
clears it (4.77–6.25:1 across both themes) and kept separate so that fixing the
badge did not shift every filled button.

**The State Has a Name rule.** Colour never carries a status alone. Every badge
pairs its tone with the word — `PAID`, `UNPAID`, `OVERDUE`, `CANCELLED`.

**The Colour Means Something rule.** A colour is only spent where it names a
value the reader compares: a state, or an enumerated category that has a
documented tone. Plan types are one tone each — Individual indigo, Shared
gold, Family emerald — because telling them apart is the job. What stays
neutral is the leftover decoration: no colour on a heading, a border, or a
badge that only repeats a label.

**The Action Tones rule.** The control carries the tone of what it does, and
the tone is defined once in the `Button` variants:

| Action                          | Variant       | Tone    |
| ------------------------------- | ------------- | ------- |
| View, Copy                      | `info`        | indigo  |
| Edit, Archive                   | `caution`     | gold    |
| Renew, Restore, Mark paid       | `positive`    | emerald |
| Delete, Cancel, Revoke          | `destructive` | coral   |
| The screen's main create/record | `accent`      | coral   |

A screen may not invent a tone for one of these actions; if a new action has no
home in the table, add it there first. Totals and counts stay neutral; only a
count of a state wears that state's tone on its left rule (`ConsoleMetric`).

**The Deadline Is Loud rule.** Where a date decides whether someone has to act,
the date itself carries the tone and a chip says it in words: gold inside 30
days, coral inside 7, neutral beyond. The windows are defined once in
`EXPIRY_WINDOW_DAYS`, so a tile reading "Expiring in 30d" and the row beneath
it can never disagree about what counts as soon.

**The Two Facts rule.** A membership has access and money, and they are
separate facts that can disagree — the row worth acting on is the one where
they do. They are never merged into one badge, and they never share a form:
**access is a filled pill, money is a hollow one**. Both want green at their
best (`ACTIVE`, `PAID`), so colour alone cannot separate them; the fill does,
for every pairing and not just the green one. The words are one vocabulary
across the ledger, the summary sheet and the record page — `PAID`, `UNPAID`,
`OVERDUE`, and `UNBILLED` for a term that was never invoiced, which is not the
same as unpaid.

## Typography

Geist for everything, Geist Mono for figures. There is no second display face.

The console is read in two sizes: `text-sm` for values a person acts on, and
`text-xs` for the labels and hints around them. `text-[11px]` uppercase marks a
column header or a metric caption. Page titles are the only large type.

**The Tabular Figures rule.** Money, counts, dates and identifiers carry
`tabular-nums`. Columns of figures that do not align are the fastest way to make
a ledger feel untrustworthy.

## Layout

Console content is centred and capped: every working screen declares
`max-w-6xl`, which the console layout's `.sm-console-content` widens to `96rem`.
Records are included — a record page carries the same tables and metric rows a
list does, and two pages of the same console reading at different widths looks
like a mistake. Only `max-w-3xl`, for a single-purpose form, keeps a narrower
measure, because a form is read one field at a time. Inset is `px-4 py-6` on a
phone and `px-6 py-10` from 640px.

The sidebar is fixed, grouped by the work rather than the entity — Catalog,
Operations, Customers, Insights, Administration — because an operator thinks in
tasks, not tables. A group whose only item repeats its own label is a plain
link, not a collapsible section with one child.

The topbar carries a `Section / Page` breadcrumb derived from that same nav,
resolving the longest matching route so a nested page names itself rather than
its parent. It never repeats the page title the page already shows.

**The Thumb Reach rule.** Below 768px the four destinations an operator uses
most sit in a fixed bottom bar, with the drawer behind "More"; phone layouts do
not hide primary navigation behind a hamburger alone. There is exactly one
control for opening that drawer, not one per bar.

**The Phone First rule.** Every surface is designed at 390px first: metric
tiles are two-up, tables scroll horizontally and drop their least load-bearing
column, and a month grid becomes the agenda rather than seven squeezed columns.
A phone layout is a reflow, not a scaled-down desktop.

## Elevation & Depth

Borders and tonal steps do the work. Panels are flat: a border plus `surface`
against `bg`. Elevation is reserved for things that genuinely float — dialogs,
the date picker, popovers — which use a backdrop and `shadow-2xl`.

The page sits on a flat `--sm-bg`, and the topbar and bottom bar are opaque.
The gradient wash and frosted-glass bars these replaced tinted the status
colours sitting on them and belonged to a landing page, not a ledger.

**The Quiet Surface rule.** A record sits on a flat bordered panel. Do not add a
shadow or a gradient to make a static panel feel important; the only thing that
distinguishes it is the border and what it says.

## Shapes

`rounded-xl` for panels, `rounded-lg` for controls and cells, `rounded-md` for
small inline controls, `rounded-full` for badges and avatars. These coexist on
purpose — panel and pill should not share a radius.

## Interaction

Every focusable element gets one ring, defined once in `globals.css`:
`2px solid var(--sm-focus)` at `2px` offset, measured at 4.8:1 (dark) and 4.3:1
(light). Three competing per-primitive conventions existed before, two of which
used a translucent accent that measured 1.4–1.7:1 — effectively no focus
indicator at all.

Pointer affordance is also a base rule, covering native elements and the ARIA
roles Base UI renders. Tailwind v4 dropped the preflight that used to do this.

**The State Parity rule.** Hover, focus, active and disabled must be visibly
distinct in _both_ themes, and a hover must not repaint over an active fill —
that bug made the selected tab read as unselected.

## Components

### Icons

`lucide-react` for the interface, `react-icons` only for third-party marks such
as the GitHub provider. One stroke weight for all of them — `globals.css` sets
`.lucide { stroke-width: 1.75 }`, because lucide's 2px default reads heavier
than the type beside it at these sizes. An icon that only shows a glyph carries
a tooltip as well as its `aria-label`: a mouse user cannot read a label they
cannot see.

Pick the icon for the thing, not the slot. Four metric tiles that repeat one
glyph are decoration — a check for settled, a clock for overdue, a crossed
circle for cancelled.

**The No Sparkles rule.** `Sparkles`, wands and other "magic" glyphs are
banned. They are the house style of generated interfaces and they name nothing:
a media library gets `Library`, a catalog identity gets `Tag`, a creation flow
gets `CirclePlus`. If no icon describes the thing, ship the heading alone.

### Controls

One primary action per screen. Secondary paths to the same outcome use
`outline`, so the accent fill always means "the main thing to do here".

`Input` and `SelectTrigger` take an `icon`. Every form field carries a leading
icon naming the **data**, not the action: `Mail` for an e-mail, `Phone` for a
number, `CalendarDays` for a date, `Coins` for a currency. A form of bare boxes
is the clearest sign a screen was not designed. `Switch`, `Checkbox`, file
inputs and inline renames are exempt — their own control is the affordance.

Date entry is `DatePicker`, never a native `<input type="date">`. The native
control renders unstyleable OS chrome that differs per platform and formats to
the OS locale.

### Panels and forms

A long form is divided into named sections, each with an icon chip, a title and
one line saying what it is for. A form that asks for money restates the term and
the amount before the submit — confirmation belongs next to the commitment, not
in a toast afterwards.

### Charts

Chart colour comes from `CHART_SEMANTIC`, mapped to the same status tones as
badges, so green means settled in both places. Tooltip styling is not per
chart: `CHART_TOOLTIP_STYLE` and its label and item companions are the only
way a tooltip is styled. Recharts hard-codes a grey for item text that is
chosen against white and disappears on the dark surface, and `contentStyle`
alone does not cover it — the label, the item and the border are three separate
props.

**The Honest Shape rule.** Match the mark to the quantity. Money billed in a
discrete month is bars; cover in force over time is a line. Never stack a
running total onto event counts — the sum means nothing. Emit quiet periods
rather than skipping them, or the axis compresses and a lapse reads as activity.

## Patterns this console does not use

**The Nothing Decorative rule.** Every element earns its place by informing the
task. These were all removed once and must not return:

- An uppercase kicker above the page title. The topbar breadcrumb already says
  where you are, and the page title says what this is.
- A "How it works" stepper strip explaining the product on a working screen.
- Metric tiles whose only variation is a glyph in a rounded square. A figure
  under its name on a ruled column reads faster and says the same thing.
- A gradient page wash, frosted-glass bars, or a drop shadow on a static panel.
- Section headings built as icon chip + title + subtitle.
- A coloured dot beside a navigation group that tracks no state.
- The same fact twice in one panel: if a row above names the customer, the row
  below carries the record's own identity, not the name again.

## Do's and Don'ts

### Do

- **Do** reserve saturated colour for state, and always name the state in words.
- **Do** reach for the existing primitive in `src/components/ui/` first, and extend it when it is close.
- **Do** use `-t` tones for text on a soft fill, and the plain tone for solid fills.
- **Do** measure contrast on a new colour pair before shipping it, in both themes.
- **Do** keep hover, focus and active distinguishable in both themes.

### Don't

- **Don't** use a native interactive element or browser dialog in feature code.
- **Don't** ship a form field without a leading icon naming its data.
- **Don't** substitute `surface2` for `hover` — they were merged once and the result was invisible.
- **Don't** define a focus ring per component; there is one, in `globals.css`.
- **Don't** add elevation or gradient to a static panel to signal importance.

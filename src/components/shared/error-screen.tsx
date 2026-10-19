import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The console's way of saying something went wrong.
 *
 * One component for every failure surface — 404, forbidden, a crashed render,
 * a fatal root error — so the same event never wears two designs. It reads as
 * the rest of the console: flat background, the status as a figure in mono,
 * one sentence saying what happened, the actions that get the operator back to
 * work, and — because a dead end is a UX failure on its own — a short list of
 * places that do exist. No illustration, no icon chip, no apology copy.
 *
 * Deliberately prop-only and hook-free: `error.tsx` and `global-error.tsx` are
 * client components, `not-found.tsx` and the forbidden page are server ones,
 * and all four must render the same thing.
 */
export function ErrorScreen({ actions, code, description, links, meta, title }: ErrorScreenProps) {
  return (
    <main className="flex min-h-screen flex-col bg-(--sm-bg) text-(--sm-fg)">
      <header className="border-b border-(--sm-border) px-6 py-4 sm:px-10">
        <span className="text-sm font-semibold tracking-tight">StreamManager</span>
      </header>

      <div className="flex flex-1 items-center px-6 py-16 sm:px-10">
        <div className="mx-auto grid w-full max-w-2xl gap-10 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div>
            <p
              className={cn(
                'font-mono text-5xl leading-none font-semibold tracking-tight tabular-nums',
                TONE[codeTone(code)]
              )}
            >
              {code}
            </p>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-prose text-sm leading-6 text-(--sm-muted)">{description}</p>
            {meta === undefined ? null : (
              <p className="mt-4 font-mono text-xs break-all text-(--sm-muted)">{meta}</p>
            )}
            {actions === undefined ? null : (
              <div className="mt-7 flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>

          {links === undefined || links.length === 0 ? null : (
            <nav
              aria-label="Places you can go"
              className="self-start lg:border-l lg:border-(--sm-border) lg:pl-8"
            >
              <p className="text-xs font-medium text-(--sm-muted)">Where you can go</p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="text-sm text-(--sm-fg) underline-offset-4 hover:text-(--sm-coral) hover:underline"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * The code carries the tone, and it names the state on its own — a 403 is not
 * a failure of the software, so it reads gold rather than coral; a 404 is a
 * miss rather than an error, so it stays neutral.
 */
function codeTone(code: string): keyof typeof TONE {
  if (code === '403') return 'caution';
  if (code === '404') return 'neutral';

  return 'critical';
}

const TONE = {
  caution: 'text-(--sm-gold)',
  critical: 'text-(--sm-coral)',
  neutral: 'text-(--sm-muted)',
} as const;

type ErrorScreenProps = {
  /** The actions that get the operator moving again, in priority order. */
  actions?: ReactNode;
  /** The HTTP status this surface stands for: 403, 404, 500. */
  code: string;
  /** One sentence: what happened, in the operator's terms. */
  description: string;
  /**
   * Working destinations. A dead end that only offers "go back" makes the
   * reader find their own way; naming two or three real pages does not.
   */
  links?: { href: string; label: string }[];
  /** Machine-readable context — the path tried, or the error digest. */
  meta?: string;
  title: string;
};

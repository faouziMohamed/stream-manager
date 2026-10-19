import { Monitor } from 'lucide-react';

export default function AuthBrandLogo({ size = 'sm' }: AuthBrandLogoProps) {
  const markSize = size === 'lg' ? 'size-14 rounded-2xl' : 'size-9 rounded-xl';
  const iconSize = size === 'lg' ? 'size-6' : 'size-4';

  return (
    <span
      className={`${markSize} relative inline-grid place-items-center overflow-hidden border border-(--sm-border) bg-(--sm-surface)`}
      aria-hidden="true"
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(135deg,var(--sm-coral),var(--sm-gold))]" />
      <span className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-(--sm-indigo)" />
      <span className="absolute right-0 bottom-0 h-1/2 w-1/2 bg-(--sm-emerald)" />
      <span className="relative grid size-[72%] place-items-center rounded-lg bg-(--sm-surface) shadow-sm">
        <Monitor className={`${iconSize} text-(--sm-fg)`} />
      </span>
    </span>
  );
}

type AuthBrandLogoProps = {
  size?: 'sm' | 'lg';
};

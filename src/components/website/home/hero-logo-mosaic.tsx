import Image from 'next/image';

export type ServiceItem = { id: string; name: string; logoUrl: string | null };

export function LogoMosaic({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) return null;

  const TOTAL = 16;
  const tiles: ServiceItem[] = [];
  while (tiles.length < TOTAL) {
    tiles.push(...services.slice(0, TOTAL - tiles.length));
  }

  return (
    <div className="relative select-none" style={{ perspective: '700px' }}>
      <div
        className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 50%, oklch(0.62 0.22 28 / 0.1), oklch(0.58 0.18 255 / 0.06), transparent)',
        }}
        aria-hidden="true"
      />

      <div
        className="grid grid-cols-4 gap-3"
        style={{
          transform: 'rotateX(18deg) rotateY(-12deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {tiles.map((s, i) => {
          const floatDuration = 2.8 + (i % 5) * 0.35;
          const floatDelay = i * 0.09;
          return (
            <div
              key={`tile-${i}`}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                background: 'var(--sm-surface)',
                borderColor: 'var(--sm-border2)',
                boxShadow: '0 8px 24px oklch(0 0 0 / 0.15)',
                animation: `sm-float ${floatDuration}s ease-in-out infinite`,
                animationDelay: `${floatDelay}s`,
              }}
            >
              {s.logoUrl ? (
                <Image
                  src={s.logoUrl}
                  alt={s.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="font-display text-xl font-bold"
                  style={{ color: 'var(--sm-coral)' }}
                >
                  {s.name.charAt(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

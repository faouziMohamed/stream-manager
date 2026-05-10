'use client';

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}) {
  const allCategories = ['all', ...categories];

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200"
            style={
              isActive
                ? { background: 'var(--sm-coral)', color: 'var(--sm-coral-fg)' }
                : {
                    background: 'var(--sm-surface2)',
                    border: '1px solid var(--sm-border)',
                    color: 'var(--sm-muted)',
                  }
            }
          >
            {cat === 'all' ? 'Tout afficher' : cat}
          </button>
        );
      })}
    </div>
  );
}

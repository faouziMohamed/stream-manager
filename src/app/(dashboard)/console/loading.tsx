export default function ConsoleLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="h-3 w-32 animate-pulse rounded-full bg-(--sm-surface2)" />
      <div className="mt-4 h-8 w-48 animate-pulse rounded-md bg-(--sm-surface2)" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-md bg-(--sm-surface2)" />
      <div className="mt-7 border-b border-(--sm-border)" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-xl border border-(--sm-border) bg-(--sm-surface)"
          />
        ))}
      </div>
    </main>
  );
}

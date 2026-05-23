type RunSequentially = {
  <A>(tasks: [() => Promise<A>]): Promise<[A]>;
  <A, B>(tasks: [() => Promise<A>, () => Promise<B>]): Promise<[A, B]>;
  <A, B, C>(tasks: [() => Promise<A>, () => Promise<B>, () => Promise<C>]): Promise<[A, B, C]>;
  <A, B, C, D>(
    tasks: [() => Promise<A>, () => Promise<B>, () => Promise<C>, () => Promise<D>]
  ): Promise<[A, B, C, D]>;
  <A, B, C, D, E>(
    tasks: [
      () => Promise<A>,
      () => Promise<B>,
      () => Promise<C>,
      () => Promise<D>,
      () => Promise<E>,
    ]
  ): Promise<[A, B, C, D, E]>;
};

export const runSequentially = (async (tasks: Array<() => Promise<unknown>>) => {
  const results: unknown[] = [];

  for (const task of tasks) {
    results.push(await task());
  }

  return results;
}) as unknown as RunSequentially;

// The API used to own its own env schema. There is a single app now, so this
// re-exports the unified schema in src/lib/settings/env.ts and exists only to
// keep server-layer imports stable.
export { env } from '@/lib/settings/env';

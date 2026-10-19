import { writeFileSync } from 'node:fs';

import { schemaTypeDefs } from '@/server/lib/graphql/schema';

// graphql-codegen used to introspect the running API over HTTP. The schema now
// lives in this repo, so we dump the SDL to a file instead — no server needed
// to run codegen.
const OUTPUT = 'schema.graphql';

writeFileSync(OUTPUT, `${schemaTypeDefs.join('\n')}\n`, 'utf8');

console.info(`Wrote ${OUTPUT}`);

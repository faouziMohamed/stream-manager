import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media uploads stream through a Server Action as raw binary (multipart),
      // so this only needs to clear the 8 MB image limit plus form overhead.
      // Keep in sync with MAX_IMAGE_UPLOAD_BYTES.
      bodySizeLimit: '10mb',
    },
  },
  // Native/optional deps pulled in by the server layer must not be bundled.
  //
  // `graphql-yoga` must NOT be added here. Externalising it loads Yoga through
  // Node's own resolver while `src/server/lib/graphql/schema.ts` keeps the
  // bundled copy of `graphql`, so the schema and the validator come from two
  // realms and every query dies with "Cannot use GraphQLSchema … from another
  // module or realm."
  serverExternalPackages: ['argon2', 'postgres', 'pino', 'pino-pretty', 'nodemailer'],
};

export default nextConfig;

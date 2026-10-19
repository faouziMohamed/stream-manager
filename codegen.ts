import type { CodegenConfig } from '@graphql-codegen/cli';

// Schema is dumped from src/server/lib/graphql/schema.ts by
// `pnpm schema:print`, which `pnpm codegen` runs first.
const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['src/features/**/graphql/*.graphql'],
  ignoreNoDocuments: false,
  generates: {
    'src/lib/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'graphql',
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: true,
        avoidOptionals: true,
        scalars: {
          Upload: 'File',
        },
      },
    },
  },
};

export default config;

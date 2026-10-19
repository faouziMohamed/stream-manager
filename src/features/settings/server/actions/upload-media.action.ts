'use server';

import { print } from 'graphql';

import { requireSession } from '@/lib/auth/require-session';
import {
  type MediaCategory,
  UploadMediaDocument,
  type UploadMediaMutation,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import { GRAPHQL_ENDPOINT, yoga } from '@/server/lib/graphql/yoga';

const log = createLogger('upload-media.action');

// The file is sent as a real binary upload using the GraphQL multipart request
// spec, which graphql-yoga parses natively. No base64 inflation, no
// intermediate string copy. gqlRequest only speaks JSON, so this goes straight
// to the Yoga handler.
export async function uploadMediaAction(file: File, category: MediaCategory) {
  await requireSession('You must be signed in to upload media');

  const form = new FormData();
  form.append(
    'operations',
    JSON.stringify({ query: print(UploadMediaDocument), variables: { category, file: null } })
  );
  form.append('map', JSON.stringify({ '0': ['variables.file'] }));
  form.append('0', file, file.name);

  const response = await yoga.fetch(`http://localhost${GRAPHQL_ENDPOINT}`, {
    method: 'POST',
    body: form,
  });

  const payload = (await response.json()) as {
    data?: UploadMediaMutation;
    errors?: { message: string }[];
  };

  const message = payload.errors?.[0]?.message;
  if (message !== undefined) {
    throw new Error(message);
  }
  if (payload.data === undefined) {
    throw new Error('The upload could not be completed. Please try again.');
  }

  log.info({ filename: file.name }, 'Media uploaded');
  return payload.data.uploadMedia;
}

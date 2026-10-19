'use server';

import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CreateServiceDocument,
  type CreateServiceMutation,
  type CreateServiceMutationVariables,
  UpdateServiceDocument,
  type UpdateServiceMutation,
  type UpdateServiceMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('services.manage.action');

type CreateServiceActionInput = {
  category: string;
  description?: unknown;
  imageKey?: string | null;
  name: string;
  supportsProfiles: boolean;
};
type UpdateServiceActionInput = {
  id: string;
  category: string;
  description?: unknown;
  imageKey?: string | null;
  name: string;
  supportsProfiles: boolean;
};

export async function createServiceAction(input: CreateServiceActionInput) {
  await requireSession('You must be signed in to manage services');
  const variables: CreateServiceMutationVariables = {
    input: {
      category: input.category,
      descriptionContent: input.description || null,
      imageKey: input.imageKey ?? null,
      name: input.name,
      supportsProfiles: input.supportsProfiles,
    },
  };
  const data = await gqlRequest<CreateServiceMutation, CreateServiceMutationVariables>(
    CreateServiceDocument,
    variables
  );

  log.info({ id: data.createService.id }, 'Service created');
  return data.createService;
}

export async function updateServiceAction(input: UpdateServiceActionInput) {
  await requireSession('You must be signed in to manage services');
  const variables: UpdateServiceMutationVariables = {
    input: {
      id: input.id,
      category: input.category,
      descriptionContent: input.description || null,
      // Form echoes the current key (preserve) or a new key; null removes the image.
      imageKey: input.imageKey ?? null,
      isActive: null,
      name: input.name,
      supportsProfiles: input.supportsProfiles,
    },
  };
  const data = await gqlRequest<UpdateServiceMutation, UpdateServiceMutationVariables>(
    UpdateServiceDocument,
    variables
  );

  log.info({ id: data.updateService.id }, 'Service updated');
  return data.updateService;
}

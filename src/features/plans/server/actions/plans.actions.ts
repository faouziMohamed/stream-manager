'use server';

import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CreatePlanDocument,
  type CreatePlanMutation,
  type CreatePlanMutationVariables,
  DeletePlanDocument,
  type DeletePlanMutation,
  type DeletePlanMutationVariables,
  UpdatePlanDocument,
  type UpdatePlanMutation,
  type UpdatePlanMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import type { PlanFormValues } from '@/features/plans/shared/plan-form.schema';

const log = createLogger('plans.actions');

export async function createPlanAction(values: PlanFormValues) {
  await requireSession('You must be signed in to manage plans');
  const input: CreatePlanMutationVariables['input'] = {
    name: values.name,
    durationMonths: values.durationMonths,
    price: values.price,
    currencyCode: values.currencyCode,
    planType: values.planType,
    descriptionContent: values.description ?? null,
    serviceId: values.serviceId,
  };

  const data = await gqlRequest<CreatePlanMutation, CreatePlanMutationVariables>(
    CreatePlanDocument,
    { input }
  );

  log.info({ id: data.createPlan.id }, 'Plan created');
  return data.createPlan;
}

export async function updatePlanAction({ id, values }: { id: string; values: PlanFormValues }) {
  await requireSession('You must be signed in to manage plans');
  const input: UpdatePlanMutationVariables['input'] = {
    id,
    name: values.name,
    durationMonths: values.durationMonths,
    price: values.price,
    currencyCode: values.currencyCode,
    planType: values.planType,
    descriptionContent: values.description ?? null,
    serviceId: values.serviceId,
    isActive: values.isActive,
  };

  const data = await gqlRequest<UpdatePlanMutation, UpdatePlanMutationVariables>(
    UpdatePlanDocument,
    { input }
  );

  log.info({ id: data.updatePlan.id }, 'Plan updated');
  return data.updatePlan;
}

export async function deletePlanAction(id: string) {
  await requireSession('You must be signed in to manage plans');
  const input: DeletePlanMutationVariables['input'] = { id };

  const data = await gqlRequest<DeletePlanMutation, DeletePlanMutationVariables>(
    DeletePlanDocument,
    { input }
  );

  log.info({ id: data.deletePlan.id }, 'Plan deleted');
  return data.deletePlan;
}

// Plans GraphQL operations — implemented in Phase 2
export const GET_PLANS = /* GraphQL */ `
  query GetPlans($serviceId: ID, $promotionId: ID) {
    plans(serviceId: $serviceId, promotionId: $promotionId) {
      id
      name
      durationMonths
      price
      currencyCode
      planType
      isActive
      serviceId
      promotionId
    }
  }
`;

export const GET_PLAN = /* GraphQL */ `
  query GetPlan($id: ID!) {
    plan(id: $id) {
      id
      name
      durationMonths
      price
      currencyCode
      planType
      isActive
      serviceId
      promotionId
    }
  }
`;

export const CREATE_PLAN = /* GraphQL */ `
  mutation CreatePlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      id
      name
      durationMonths
      price
      currencyCode
      planType
      isActive
    }
  }
`;

export const UPDATE_PLAN = /* GraphQL */ `
  mutation UpdatePlan($id: ID!, $input: UpdatePlanInput!) {
    updatePlan(id: $id, input: $input) {
      id
      name
      durationMonths
      price
      currencyCode
      planType
      isActive
    }
  }
`;

export const DELETE_PLAN = /* GraphQL */ `
  mutation DeletePlan($id: ID!) {
    deletePlan(id: $id)
  }
`;

export type PlanType = "full" | "partial" | "custom" | "bundle";

export interface PlanDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  currencyCode: string;
  planType: PlanType;
  description: string | null;
  isActive: boolean;
  serviceId: string | null;
  promotionId: string | null;
}

export interface CreatePlanInput {
  name: string;
  durationMonths: number;
  price: number;
  currencyCode: string;
  planType: PlanType;
  description?: string;
  serviceId?: string;
  promotionId?: string;
}

export interface UpdatePlanInput {
  name?: string;
  durationMonths?: number;
  price?: number;
  currencyCode?: string;
  planType?: PlanType;
  description?: string;
  isActive?: boolean;
}

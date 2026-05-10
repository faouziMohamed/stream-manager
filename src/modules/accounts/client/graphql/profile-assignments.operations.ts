export const GET_SUBSCRIPTION_ASSIGNMENT = /*graphql*/ `
  query GetSubscriptionAssignment($subscriptionId: ID!) {
    subscriptionAssignment(subscriptionId: $subscriptionId) {
      id
      subscriptionId
      accountId
      profileId
    }
  }
`;

export const ASSIGN_PROFILE = /*graphql*/ `
  mutation AssignProfile($input: AssignProfileInput!) {
    assignProfile(input: $input) {
      id
      subscriptionId
      accountId
      profileId
    }
  }
`;

export const REMOVE_ASSIGNMENT = /*graphql*/ `
  mutation RemoveAssignment($subscriptionId: ID!) {
    removeAssignment(subscriptionId: $subscriptionId)
  }
`;

export interface AssignProfileInput {
  subscriptionId: string;
  accountId: string;
  profileId?: string | null;
}

// Streaming profiles GraphQL operations

export const GET_STREAMING_PROFILES = /*graphql*/ `
  query GetStreamingProfiles($accountId: ID!) {
    streamingProfiles(accountId: $accountId) {
      id
      accountId
      name
      profileIndex
      isActive
      assignment {
        id
        subscriptionId
        subscription {
          id
          client {
            id
            name
          }
          endDate
          status
        }
      }
    }
  }
`;

export const CREATE_PROFILE = /*graphql*/ `
  mutation CreateProfile($input: CreateProfileInput!) {
    createProfile(input: $input) {
      id
      accountId
      name
      profileIndex
      pin
      isActive
    }
  }
`;

export const UPDATE_PROFILE = /*graphql*/ `
  mutation UpdateProfile($id: ID!, $input: UpdateProfileInput!) {
    updateProfile(id: $id, input: $input) {
      id
      name
      profileIndex
      pin
      isActive
    }
  }
`;

export const DELETE_PROFILE = /*graphql*/ `
  mutation DeleteProfile($id: ID!) {
    deleteProfile(id: $id)
  }
`;

export interface CreateProfileInput {
  accountId: string;
  name: string;
  profileIndex?: number;
  pin?: string;
}

export interface UpdateProfileInput {
  name?: string;
  profileIndex?: number;
  pin?: string | null;
  isActive?: boolean;
}

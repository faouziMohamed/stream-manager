export const GET_STREAMING_ACCOUNTS = /* GraphQL */ `
    query GetStreamingAccounts($serviceId: ID) {
        streamingAccounts(serviceId: $serviceId) {
            id
            serviceId
            label
            email
            maxProfiles
            usedProfiles
            notes
            isActive
            createdAt
            updatedAt
            service {
                id
                name
                logoUrl
            }
            profiles {
                id
                name
                profileIndex
                isActive
                assignment {
                    id
                    subscriptionId
                    subscription {
                        id
                        client { id name }
                        endDate
                        status
                    }
                }
            }
        }
    }
`;

export const GET_STREAMING_PROFILES = /* GraphQL */ `
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
                    client { id name }
                    endDate
                    status
                }
            }
        }
    }
`;

export const GET_SUBSCRIPTION_ASSIGNMENT = /* GraphQL */ `
    query GetSubscriptionAssignment($subscriptionId: ID!) {
        subscriptionAssignment(subscriptionId: $subscriptionId) {
            id
            subscriptionId
            accountId
            profileId
        }
    }
`;

export const CREATE_ACCOUNT = /* GraphQL */ `
    mutation CreateAccount($input: CreateAccountInput!) {
        createAccount(input: $input) {
            id
            serviceId
            label
            email
            maxProfiles
            usedProfiles
            notes
            isActive
            createdAt
            updatedAt
            service { id name logoUrl }
            profiles { id name profileIndex isActive }
        }
    }
`;

export const UPDATE_ACCOUNT = /* GraphQL */ `
    mutation UpdateAccount($id: ID!, $input: UpdateAccountInput!) {
        updateAccount(id: $id, input: $input) {
            id
            serviceId
            label
            email
            maxProfiles
            notes
            isActive
            updatedAt
        }
    }
`;

export const DELETE_ACCOUNT = /* GraphQL */ `
    mutation DeleteAccount($id: ID!) {
        deleteAccount(id: $id)
    }
`;

export const CREATE_PROFILE = /* GraphQL */ `
    mutation CreateProfile($input: CreateProfileInput!) {
        createProfile(input: $input) {
            id
            accountId
            name
            profileIndex
            isActive
        }
    }
`;

export const UPDATE_PROFILE = /* GraphQL */ `
    mutation UpdateProfile($id: ID!, $input: UpdateProfileInput!) {
        updateProfile(id: $id, input: $input) {
            id
            name
            profileIndex
            isActive
        }
    }
`;

export const DELETE_PROFILE = /* GraphQL */ `
    mutation DeleteProfile($id: ID!) {
        deleteProfile(id: $id)
    }
`;

export const ASSIGN_PROFILE = /* GraphQL */ `
    mutation AssignProfile($input: AssignProfileInput!) {
        assignProfile(input: $input) {
            id
            subscriptionId
            accountId
            profileId
        }
    }
`;

export const REMOVE_ASSIGNMENT = /* GraphQL */ `
    mutation RemoveAssignment($subscriptionId: ID!) {
        removeAssignment(subscriptionId: $subscriptionId)
    }
`;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface StreamingAccountDto {
    id: string;
    serviceId: string;
    label: string;
    email: string | null;
    maxProfiles: number;
    usedProfiles: number;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    service: { id: string; name: string; logoUrl: string | null } | null;
    profiles: StreamingProfileDto[];
}

export interface StreamingProfileDto {
    id: string;
    accountId: string;
    name: string;
    profileIndex: number;
    isActive: boolean;
    assignment: SubscriptionAssignmentDto | null;
}

export interface SubscriptionAssignmentDto {
    id: string;
    subscriptionId: string;
    accountId: string;
    profileId: string | null;
    subscription?: {
        id: string;
        client: { id: string; name: string } | null;
        endDate: string;
        status: string;
    } | null;
}

export interface CreateAccountInput {
    serviceId: string;
    label: string;
    email?: string;
    password?: string;
    maxProfiles?: number;
    notes?: string;
}

export interface UpdateAccountInput {
    label?: string;
    email?: string;
    password?: string;
    maxProfiles?: number;
    notes?: string;
    isActive?: boolean;
}

export interface CreateProfileInput {
    accountId: string;
    name: string;
    profileIndex?: number;
}

export interface UpdateProfileInput {
    name?: string;
    profileIndex?: number;
    isActive?: boolean;
}

export interface AssignProfileInput {
    subscriptionId: string;
    accountId: string;
    profileId?: string | null;
}

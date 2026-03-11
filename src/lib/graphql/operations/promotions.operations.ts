// Promotions GraphQL operations
export const GET_PROMOTIONS = /* GraphQL */ `
    query GetPromotions {
        promotions {
            id
            name
            description
            isActive
            showOnHomepage
            isExpired
            startsAt
            expiresAt
            services { id name logoUrl }
            plans { id name durationMonths price currencyCode }
        }
    }
`;

export const CREATE_PROMOTION = /* GraphQL */ `
    mutation CreatePromotion($input: CreatePromotionInput!) {
        createPromotion(input: $input) {
            id name description isActive showOnHomepage isExpired startsAt expiresAt
            services { id name logoUrl }
        }
    }
`;

export const UPDATE_PROMOTION = /* GraphQL */ `
    mutation UpdatePromotion($id: ID!, $input: UpdatePromotionInput!) {
        updatePromotion(id: $id, input: $input) {
            id name description isActive showOnHomepage isExpired startsAt expiresAt
            services { id name logoUrl }
        }
    }
`;

export const DELETE_PROMOTION = /* GraphQL */ `
    mutation DeletePromotion($id: ID!) {
        deletePromotion(id: $id)
    }
`;

export interface PromotionDto {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    showOnHomepage: boolean;
    isExpired: boolean;
    startsAt: string | null;
    expiresAt: string | null;
    services: Array<{ id: string; name: string; logoUrl?: string | null }>;
    plans: Array<{
        id: string;
        name: string;
        durationMonths: number;
        price: number;
        currencyCode: string;
    }>;
}

export interface CreatePromotionInput {
    name: string;
    description?: string;
    serviceIds: string[];
    newServiceName?: string;
    newServiceCategory?: string;
    startsAt?: string;
    expiresAt?: string;
    showOnHomepage?: boolean;
}

export interface UpdatePromotionInput {
    name?: string;
    description?: string;
    isActive?: boolean;
    showOnHomepage?: boolean;
    serviceIds?: string[];
    startsAt?: string;
    expiresAt?: string;
}

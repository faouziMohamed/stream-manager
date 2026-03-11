// Services GraphQL operations — implemented in Phase 2
export const GET_SERVICES = /* GraphQL */ `
  query GetServices {
    services {
      id
      name
      category
      description
      logoUrl
      isActive
      showOnHomepage
      createdAt
      updatedAt
    }
  }
`;

export const GET_SERVICE = /* GraphQL */ `
  query GetService($id: ID!) {
    service(id: $id) {
      id
      name
      category
      description
      logoUrl
      isActive
      plans {
        id
        name
        durationMonths
        price
        currencyCode
        planType
        isActive
      }
    }
  }
`;

export const CREATE_SERVICE = /* GraphQL */ `
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      id
      name
      category
      description
      logoUrl
      isActive
      showOnHomepage
      createdAt
    }
  }
`;

export const UPDATE_SERVICE = /* GraphQL */ `
  mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
    updateService(id: $id, input: $input) {
      id
      name
      category
      description
      logoUrl
      isActive
      showOnHomepage
      updatedAt
    }
  }
`;

export const DELETE_SERVICE = /* GraphQL */ `
  mutation DeleteService($id: ID!) {
    deleteService(id: $id)
  }
`;

// TypeScript types
export interface ServiceDto {
  id: string;
  name: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  category: string;
  description?: string;
  logoUrl?: string;
  showOnHomepage?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  category?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  showOnHomepage?: boolean;
}

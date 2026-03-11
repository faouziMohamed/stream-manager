import { gql } from "graphql-request";

export const GET_SERVICES = gql`
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

export const GET_DELETED_SERVICES = gql`
  query GetDeletedServices {
    deletedServices {
      id
      name
      category
      description
      logoUrl
      isActive
      showOnHomepage
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

export const GET_SERVICE = gql`
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

export const CREATE_SERVICE = gql`
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

export const UPDATE_SERVICE = gql`
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

export const DELETE_SERVICE = gql`
  mutation DeleteService($id: ID!, $force: Boolean) {
    deleteService(id: $id, force: $force)
  }
`;

export const RESTORE_SERVICE = gql`
  mutation RestoreService($id: ID!) {
    restoreService(id: $id) {
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
  deletedAt?: string | null;
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

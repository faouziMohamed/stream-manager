// Clients GraphQL operations
export const GET_CLIENTS = /* GraphQL */ `
  query GetClients {
    clients {
      id
      name
      email
      phone
      notes
      isActive
      activeSubscriptionsCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENT = /* GraphQL */ `
  query GetClient($id: ID!) {
    client(id: $id) {
      id
      name
      email
      phone
      notes
      isActive
      subscriptions {
        id
        status
        startDate
        endDate
        isRecurring
        plan {
          id
          name
          durationMonths
          price
          currencyCode
        }
      }
    }
  }
`;

export const CREATE_CLIENT = /* GraphQL */ `
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      name
      email
      phone
      notes
      isActive
      createdAt
    }
  }
`;

export const UPDATE_CLIENT = /* GraphQL */ `
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      name
      email
      phone
      notes
      isActive
      updatedAt
    }
  }
`;

export const DELETE_CLIENT = /* GraphQL */ `
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;

export interface ClientDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  activeSubscriptionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

export const GET_SUMMARY_LINKS = /*graphql*/ `
  query GetSummaryLinks {
    summaryLinks {
      id
      token
      label
      showSensitiveInfo
      isActive
      expiresAt
      shareUrl
      createdAt
    }
  }
`;

export const CREATE_SUMMARY_LINK = /*graphql*/ `
  mutation CreateSummaryLink(
    $label: String
    $showSensitiveInfo: Boolean!
    $expiresAt: DateTime
  ) {
    createSummaryLink(
      label: $label
      showSensitiveInfo: $showSensitiveInfo
      expiresAt: $expiresAt
    ) {
      id
      token
      label
      showSensitiveInfo
      isActive
      expiresAt
      shareUrl
      createdAt
    }
  }
`;

export const DELETE_SUMMARY_LINK = /*graphql*/ `
  mutation DeleteSummaryLink($id: ID!) {
    deleteSummaryLink(id: $id)
  }
`;

export const TOGGLE_SUMMARY_LINK = /*graphql*/ `
  mutation ToggleSummaryLink($id: ID!, $isActive: Boolean!) {
    toggleSummaryLink(id: $id, isActive: $isActive) {
      id
      isActive
      shareUrl
    }
  }
`;

export interface SummaryLinkDto {
  id: string;
  token: string;
  label: string | null;
  showSensitiveInfo: boolean;
  isActive: boolean;
  expiresAt: string | null;
  shareUrl: string;
  createdAt: string;
}

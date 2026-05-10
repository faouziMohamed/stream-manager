export const GET_NOTIFICATION_SETTINGS = /*graphql*/ `
  query GetNotificationSettings {
    notificationSettings {
      event
      label
      enabled
    }
  }
`;

export const GET_NOTIFICATION_HISTORY = /*graphql*/ `
  query GetNotificationHistory($limit: Int) {
    notificationHistory(limit: $limit) {
      id
      event
      subject
      toEmail
      success
      errorMessage
      createdAt
    }
  }
`;

export const SET_NOTIFICATION_SETTING = /*graphql*/ `
  mutation SetNotificationSetting($event: String!, $enabled: Boolean!) {
    setNotificationSetting(event: $event, enabled: $enabled) {
      event
      label
      enabled
    }
  }
`;

export interface NotificationSettingDto {
  event: string;
  label: string;
  enabled: boolean;
}

export interface NotificationEventDto {
  id: string;
  event: string;
  subject: string;
  toEmail: string;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

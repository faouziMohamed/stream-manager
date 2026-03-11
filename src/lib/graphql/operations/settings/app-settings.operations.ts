export const GET_DEFAULT_CURRENCY = /*graphql*/ `
  query GetDefaultCurrency {
    defaultCurrency
  }
`;

export const GET_APP_SETTING = /*graphql*/ `
  query GetAppSetting($key: String!) {
    appSetting(key: $key) {
      key
      value
    }
  }
`;

export const SET_APP_SETTING = /*graphql*/ `
  mutation SetAppSetting($key: String!, $value: String!) {
    setAppSetting(key: $key, value: $value) {
      key
      value
    }
  }
`;

export interface AppSettingDto {
  key: string;
  value: string;
}

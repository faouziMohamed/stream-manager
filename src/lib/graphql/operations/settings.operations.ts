// Settings GraphQL operations
export const GET_DEFAULT_CURRENCY = /* GraphQL */ `
    query GetDefaultCurrency {
        defaultCurrency
    }
`;

export const GET_APP_SETTING = /* GraphQL */ `
    query GetAppSetting($key: String!) {
        appSetting(key: $key) {
            key
            value
        }
    }
`;

export const SET_APP_SETTING = /* GraphQL */ `
    mutation SetAppSetting($key: String!, $value: String!) {
        setAppSetting(key: $key, value: $value) {
            key
            value
        }
    }
`;

export const GET_SUMMARY_LINKS = /* GraphQL */ `
    query GetSummaryLinks {
        summaryLinks {
            id token label showSensitiveInfo isActive expiresAt shareUrl createdAt
        }
    }
`;

export const CREATE_SUMMARY_LINK = /* GraphQL */ `
    mutation CreateSummaryLink($label: String, $showSensitiveInfo: Boolean!, $expiresAt: DateTime) {
        createSummaryLink(label: $label, showSensitiveInfo: $showSensitiveInfo, expiresAt: $expiresAt) {
            id token label showSensitiveInfo isActive expiresAt shareUrl createdAt
        }
    }
`;

export const DELETE_SUMMARY_LINK = /* GraphQL */ `
    mutation DeleteSummaryLink($id: ID!) {
        deleteSummaryLink(id: $id)
    }
`;

export const TOGGLE_SUMMARY_LINK = /* GraphQL */ `
    mutation ToggleSummaryLink($id: ID!, $isActive: Boolean!) {
        toggleSummaryLink(id: $id, isActive: $isActive) {
            id isActive shareUrl
        }
    }
`;

export const GET_SMTP_SETTINGS = /* GraphQL */ `
    query GetSmtpSettings {
        smtpSettings {
            host port secure user senderEmail senderName hasPassword
        }
    }
`;

export const SET_SMTP_SETTINGS = /* GraphQL */ `
    mutation SetSmtpSettings($input: SmtpSettingsInput!) {
        setSmtpSettings(input: $input) {
            host port secure user senderEmail senderName hasPassword
        }
    }
`;

export interface SmtpSettingsDto {
    host: string | null;
    port: number | null;
    secure: boolean | null;
    user: string | null;
    senderEmail: string | null;
    senderName: string | null;
    hasPassword: boolean;
}

export interface SmtpSettingsInput {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password?: string;
    senderEmail: string;
    senderName: string;
}

export interface AppSettingDto {
    key: string;
    value: string;
}

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

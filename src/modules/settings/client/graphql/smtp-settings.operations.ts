export const GET_SMTP_SETTINGS = /*graphql*/ `
  query GetSmtpSettings {
    smtpSettings {
      host
      port
      secure
      user
      senderEmail
      senderName
      hasPassword
    }
  }
`;

export const SET_SMTP_SETTINGS = /*graphql*/ `
  mutation SetSmtpSettings($input: SmtpSettingsInput!) {
    setSmtpSettings(input: $input) {
      host
      port
      secure
      user
      senderEmail
      senderName
      hasPassword
    }
  }
`;

export const TEST_SMTP = /*graphql*/ `
  mutation TestSmtp($toEmail: String!) {
    testSmtp(toEmail: $toEmail) {
      success
      message
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

export interface TestResultDto {
  success: boolean;
  message: string;
}

export type SessionItem = {
  id: string;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  countryCode: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
};

export type UserRole = 'admin' | 'accountant' | 'user';

export interface UserModel {
  avatar: string | null;
  email: string;
  id: string;
  name: string;
  role: UserRole;
}

export interface SessionModel {
  browser: string | null;
  countryCode: string | null;
  createdAt: Date;
  deviceType: string | null;
  id: string;
  ipHash: string | null;
  lastUsedAt: Date;
  os: string | null;
  userId: string;
}

// Auth.js owns the browser session cookie. A login use-case only records a row
// in auth_sessions and hands back its id, which Auth.js stores in the JWT so
// every request can re-check that the session has not been revoked.
export interface AuthPayload {
  sessionId: string;
  user: UserModel;
}

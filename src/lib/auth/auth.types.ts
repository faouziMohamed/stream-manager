import type { Session, User } from 'next-auth';

export type AuthRole = 'admin' | 'accountant' | 'user';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  image?: string | null;
};

export type AuthToken = {
  userId?: string;
  // Row id in auth_sessions. Checked on every GraphQL request so a revoked
  // session logs the user out even though their cookie is still valid.
  sessionId?: string;
  role?: AuthRole;
  user?: AuthUser;
};

export type AppSession = Session & {
  sessionId?: string;
  user: Session['user'] & {
    id?: string;
    role?: AuthRole;
  };
};

export type AuthenticatedUser = User & AuthToken;

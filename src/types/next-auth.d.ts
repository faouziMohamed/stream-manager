import type { DefaultSession } from 'next-auth';

import type { AuthRole } from '@/lib/auth/auth.types';

declare module 'next-auth' {
  interface Session {
    // Row id in auth_sessions, re-checked server-side on every GraphQL request.
    sessionId?: string;
    user: DefaultSession['user'] & {
      id?: string;
      role?: AuthRole;
    };
  }

  interface User {
    id?: string;
    role?: AuthRole;
    sessionId?: string;
    userId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    sessionId?: string;
    role?: AuthRole;
  }
}

export type NextAuthModuleAugmentation = true;

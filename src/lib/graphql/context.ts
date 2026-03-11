import { auth } from "@/lib/auth/auth";
import { isAccountant, isAdmin } from "@/lib/auth/helpers";
import type { User } from "@/lib/db/tables/auth.table";

export interface GraphQLContext {
  user: User | null;
  isAdmin: boolean;
  isAccountant: boolean;
}

export async function createGraphQLContext(
  request: Request,
): Promise<GraphQLContext> {
  try {
    const session = await auth.api
      .getSession({ headers: request.headers })
      .catch(() => null);
    const user = session?.user as User | null;
    return {
      user: user ?? null,
      isAdmin: isAdmin(user),
      isAccountant: isAccountant(user),
    };
  } catch {
    return { user: null, isAdmin: false, isAccountant: false };
  }
}

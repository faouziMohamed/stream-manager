import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../context";

function requireAdmin(ctx: GraphQLContext) {
  if (!ctx.isAdmin) {
    throw new GraphQLError("FORBIDDEN", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

function requireAuth(ctx: GraphQLContext) {
  if (!ctx.user) {
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export { requireAdmin, requireAuth };

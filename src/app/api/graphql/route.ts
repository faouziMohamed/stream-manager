import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { createGraphQLContext } from "@/lib/graphql/context";
import { env } from "@/lib/settings/env";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  logging: "debug",
  landingPage: true,
  graphqlEndpoint: "/api/graphql",
  graphiql: env.NODE_ENV === "development",
  context: ({ request }) => createGraphQLContext(request),
});

export const { fetch: GET, fetch: POST } = yoga;

import { yoga } from '@/server/lib/graphql/yoga';

// Yoga needs the Node.js runtime (postgres, argon2, pino) and must never be
// prerendered or cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleRequest(request: Request): Promise<Response> {
  return yoga.handleRequest(request, {});
}

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };

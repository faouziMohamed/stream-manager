import { db } from '@/lib/db';
import { clients } from '@/lib/db/tables/subscription-management.table';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';

const logger = createLogger('clients-repository');

export type CreateClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export type UpdateClientInput = Partial<CreateClientInput & { isActive: boolean }>;

export async function getAllClients() {
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClientById(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return client ?? null;
}

export async function createClient(input: CreateClientInput) {
  const id = nanoid();
  const [client] = await db.insert(clients).values({ id, ...input }).returning();
  logger.info({ id }, 'Created client');
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const [client] = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  return client ?? null;
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
  logger.info({ id }, 'Deleted client');
  return true;
}

import {requireAdmin, requireAuth} from './guards';
import {
    getAllAccounts,
    getAccountById,
    getAccountsByService,
    createAccount,
    updateAccount,
    deleteAccount,
    getProfilesByAccount,
    getProfileById,
    createProfile,
    updateProfile,
    deleteProfile,
    getAssignmentsBySubscription,
    getAssignmentsByProfile,
    assignSubscriptionToProfile,
    removeAssignment,
} from '@/lib/db/repositories/accounts.repository';
import {getServiceById} from '@/lib/db/repositories/services.repository';
import type {GraphQLContext} from '../context';
import {createLogger} from '@/lib/logger';

const logger = createLogger('accounts-resolvers');

export const accountsResolvers = {
    Query: {
        streamingAccounts: async (
            _: unknown,
            {serviceId}: { serviceId?: string },
            ctx: GraphQLContext,
        ) => {
            requireAuth(ctx);
            return serviceId ? getAccountsByService(serviceId) : getAllAccounts();
        },
        streamingAccount: async (_: unknown, {id}: { id: string }, ctx: GraphQLContext) => {
            requireAuth(ctx);
            return getAccountById(id);
        },
        streamingProfiles: async (
            _: unknown,
            {accountId}: { accountId: string },
            ctx: GraphQLContext,
        ) => {
            requireAuth(ctx);
            return getProfilesByAccount(accountId);
        },
        subscriptionAssignment: async (
            _: unknown,
            {subscriptionId}: { subscriptionId: string },
            ctx: GraphQLContext,
        ) => {
            requireAuth(ctx);
            const [row] = await getAssignmentsBySubscription(subscriptionId);
            return row ?? null;
        },
    },

    Mutation: {
        createAccount: async (
            _: unknown,
            {input}: { input: Parameters<typeof createAccount>[0] },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return createAccount(input);
        },
        updateAccount: async (
            _: unknown,
            {id, input}: { id: string; input: Parameters<typeof updateAccount>[1] },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return updateAccount(id, input);
        },
        deleteAccount: async (_: unknown, {id}: { id: string }, ctx: GraphQLContext) => {
            requireAdmin(ctx);
            return deleteAccount(id);
        },
        createProfile: async (
            _: unknown,
            {input}: { input: Parameters<typeof createProfile>[0] },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return createProfile(input);
        },
        updateProfile: async (
            _: unknown,
            {id, input}: { id: string; input: Parameters<typeof updateProfile>[1] },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return updateProfile(id, input);
        },
        deleteProfile: async (_: unknown, {id}: { id: string }, ctx: GraphQLContext) => {
            requireAdmin(ctx);
            return deleteProfile(id);
        },
        assignProfile: async (
            _: unknown,
            {input}: { input: { subscriptionId: string; accountId: string; profileId?: string | null } },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return assignSubscriptionToProfile(
                input.subscriptionId,
                input.accountId,
                input.profileId,
            );
        },
        removeAssignment: async (
            _: unknown,
            {subscriptionId}: { subscriptionId: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return removeAssignment(subscriptionId);
        },
    },

    StreamingAccount: {
        service: (parent: { serviceId: string }) => getServiceById(parent.serviceId),
        profiles: (parent: { id: string }) => getProfilesByAccount(parent.id),
        usedProfiles: async (parent: { id: string }) => {
            const assignments = await getAssignmentsBySubscription('').catch(() => []);
            // Count profiles used under this account
            const all = await getProfilesByAccount(parent.id);
            let count = 0;
            for (const p of all) {
                const [a] = await getAssignmentsByProfile(p.id);
                if (a) count++;
            }
            return count;
        },
    },

    StreamingProfile: {
        assignment: async (parent: { id: string }) => {
            const [row] = await getAssignmentsByProfile(parent.id);
            return row ?? null;
        },
    },
};

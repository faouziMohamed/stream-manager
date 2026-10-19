import { GraphQLError } from 'graphql';
import { validateInput } from '@/server/features/common/middleware/validate-input';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { revokeSessionInputSchema } from '@/server/features/auth/schemas/validators/auth.validators';
import {
  updateUserRoleInputSchema,
  deleteUserInputSchema,
  logoutUserDevicesInputSchema,
} from '@/server/features/auth/schemas/validators/user-management.validators';
import type { SessionModel } from '@/server/features/auth/schemas/model/auth.model';
import { listSessionsUseCase } from '@/server/features/auth/use-cases/list-sessions.use-case';
import { logoutAllDevicesUseCase } from '@/server/features/auth/use-cases/logout-all-devices.use-case';
import { logoutUseCase } from '@/server/features/auth/use-cases/logout.use-case';
import { revokeSessionUseCase } from '@/server/features/auth/use-cases/revoke-session.use-case';
import {
  listUsersUseCase,
  updateUserRoleUseCase,
  deleteUserUseCase,
} from '@/server/features/auth/use-cases/user-management.use-case';

export const authResolvers = {
  Query: {
    async sessions(_parent: unknown, _args: unknown, context: GqlContext) {
      requireAuth(context);
      const sessions = await listSessionsUseCase({ userId: context.user.id });

      return sessions.map((session: SessionModel) => ({
        browser: session.browser,
        countryCode: session.countryCode,
        createdAt: session.createdAt.toISOString(),
        current: session.id === context.sessionId,
        deviceType: session.deviceType,
        id: session.id,
        lastUsedAt: session.lastUsedAt.toISOString(),
        os: session.os,
      }));
    },
    async users(_parent: unknown, _args: unknown, context: GqlContext) {
      requireAdmin(context);
      return listUsersUseCase();
    },
  },
  Mutation: {
    async logout(_parent: unknown, _args: unknown, context: GqlContext) {
      requireAuth(context);

      if (context.sessionId === null) {
        throw new GraphQLError('Current session is unavailable', {
          extensions: { code: 'SESSION_REQUIRED', statusCode: 400 },
        });
      }

      return logoutUseCase({
        sessionId: context.sessionId,
        userId: context.user.id,
      });
    },
    async logoutAllDevices(_parent: unknown, _args: unknown, context: GqlContext) {
      requireAuth(context);
      return logoutAllDevicesUseCase({ userId: context.user.id });
    },
    async revokeSession(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      requireAuth(context);
      const input = validateInput(revokeSessionInputSchema, args.input);

      return revokeSessionUseCase({
        sessionId: input.id,
        userId: context.user.id,
      });
    },
    async updateUserRole(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      requireAdmin(context);
      const input = validateInput(updateUserRoleInputSchema, args.input);

      return updateUserRoleUseCase({
        id: input.id,
        role: input.role,
      });
    },
    async deleteUser(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      requireAdmin(context);
      const input = validateInput(deleteUserInputSchema, args.input);

      return deleteUserUseCase(input.id);
    },
    async logoutUserDevices(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      requireAdmin(context);
      const input = validateInput(logoutUserDevicesInputSchema, args.input);

      return logoutAllDevicesUseCase({ userId: input.userId });
    },
  },
};

interface ResolverArgs<TInput> {
  input: TInput;
}

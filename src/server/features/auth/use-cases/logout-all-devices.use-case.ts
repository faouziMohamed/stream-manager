import { revokeAllAuthSessionsByUserId } from '@/server/features/auth/repositories/auth-sessions.repository';

export async function logoutAllDevicesUseCase(
  input: LogoutAllDevicesInput,
  dependencies: LogoutAllDevicesDependencies = defaultDependencies
): Promise<boolean> {
  await dependencies.revokeAllAuthSessionsByUserId(input.userId);
  return true;
}

interface LogoutAllDevicesInput {
  userId: string;
}

interface LogoutAllDevicesDependencies {
  revokeAllAuthSessionsByUserId: (userId: string) => Promise<unknown>;
}

const defaultDependencies: LogoutAllDevicesDependencies = {
  revokeAllAuthSessionsByUserId,
};

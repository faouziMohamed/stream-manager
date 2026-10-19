import { schemaResolvers } from '@/server/lib/graphql/resolvers';

describe('schemaResolvers', () => {
  it('exposes the plans query resolver in the root Query map', () => {
    expect(schemaResolvers.Query.plans).toBeInstanceOf(Function);
  });

  it('exposes all feature query resolvers in the root Query map', () => {
    expect(schemaResolvers.Query.sessions).toBeInstanceOf(Function);
    expect(schemaResolvers.Query.users).toBeInstanceOf(Function);
    expect(schemaResolvers.Query.payments).toBeInstanceOf(Function);
    expect(schemaResolvers.Query.payment).toBeInstanceOf(Function);
    expect(schemaResolvers.Query.mediaAssets).toBeInstanceOf(Function);
    expect(schemaResolvers.Query.summaryLinks).toBeInstanceOf(Function);
  });
});

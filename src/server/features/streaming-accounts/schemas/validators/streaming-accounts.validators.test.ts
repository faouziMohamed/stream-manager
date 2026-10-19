import {
  assignProfileToMembershipInputSchema,
  createStreamingAccountInputSchema,
  createStreamingProfileInputSchema,
  unassignProfileInputSchema,
} from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';

describe('createStreamingAccountInputSchema', () => {
  it('normalizes valid input', () => {
    const result = createStreamingAccountInputSchema.parse({
      label: '  Netflix Main  ',
      serviceId: '  svc_netflix  ',
    });

    expect(result).toEqual({
      email: undefined,
      label: 'Netflix Main',
      maxProfiles: 1,
      password: undefined,
      serviceId: 'svc_netflix',
      supportsProfiles: false,
    });
  });

  it('accepts optional email, password, supportsProfiles and maxProfiles', () => {
    const result = createStreamingAccountInputSchema.parse({
      email: 'admin@netflix.com',
      label: 'Netflix Main',
      maxProfiles: 4,
      password: 'secret123',
      serviceId: 'svc_netflix',
      supportsProfiles: true,
    });

    expect(result).toEqual({
      email: 'admin@netflix.com',
      label: 'Netflix Main',
      maxProfiles: 4,
      password: 'secret123',
      serviceId: 'svc_netflix',
      supportsProfiles: true,
    });
  });

  it('accepts nullable email and password', () => {
    const result = createStreamingAccountInputSchema.parse({
      email: null,
      label: 'Netflix Main',
      password: null,
      serviceId: 'svc_netflix',
    });

    expect(result).toEqual({
      email: null,
      label: 'Netflix Main',
      maxProfiles: 1,
      password: null,
      serviceId: 'svc_netflix',
      supportsProfiles: false,
    });
  });

  it('rejects empty label', () => {
    expect(() =>
      createStreamingAccountInputSchema.parse({
        label: '   ',
        serviceId: 'svc_netflix',
      })
    ).toThrow();
  });

  it('rejects empty serviceId', () => {
    expect(() =>
      createStreamingAccountInputSchema.parse({
        label: 'Netflix Main',
        serviceId: '   ',
      })
    ).toThrow();
  });

  it('rejects maxProfiles below 1', () => {
    expect(() =>
      createStreamingAccountInputSchema.parse({
        label: 'Netflix Main',
        maxProfiles: 0,
        serviceId: 'svc_netflix',
      })
    ).toThrow();
  });

  it('rejects maxProfiles above 100', () => {
    expect(() =>
      createStreamingAccountInputSchema.parse({
        label: 'Netflix Main',
        maxProfiles: 101,
        serviceId: 'svc_netflix',
      })
    ).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() =>
      createStreamingAccountInputSchema.parse({
        email: 'not-an-email',
        label: 'Netflix Main',
        serviceId: 'svc_netflix',
      })
    ).toThrow();
  });
});

describe('createStreamingProfileInputSchema', () => {
  it('normalizes valid input', () => {
    const result = createStreamingProfileInputSchema.parse({
      accountId: '  acc_test  ',
      name: '  Profile 1  ',
    });

    expect(result).toEqual({
      accountId: 'acc_test',
      name: 'Profile 1',
      pin: undefined,
    });
  });

  it('accepts optional pin', () => {
    const result = createStreamingProfileInputSchema.parse({
      accountId: 'acc_test',
      name: 'Profile 1',
      pin: '1234',
    });

    expect(result).toEqual({
      accountId: 'acc_test',
      name: 'Profile 1',
      pin: '1234',
    });
  });

  it('accepts nullable pin', () => {
    const result = createStreamingProfileInputSchema.parse({
      accountId: 'acc_test',
      name: 'Profile 1',
      pin: null,
    });

    expect(result).toEqual({
      accountId: 'acc_test',
      name: 'Profile 1',
      pin: null,
    });
  });

  it('rejects empty accountId', () => {
    expect(() =>
      createStreamingProfileInputSchema.parse({
        accountId: '   ',
        name: 'Profile 1',
      })
    ).toThrow();
  });

  it('rejects empty name', () => {
    expect(() =>
      createStreamingProfileInputSchema.parse({
        accountId: 'acc_test',
        name: '   ',
      })
    ).toThrow();
  });
});

describe('assignProfileToMembershipInputSchema', () => {
  it('normalizes valid input', () => {
    const result = assignProfileToMembershipInputSchema.parse({
      accountId: '  acc_test  ',
      membershipId: '  mbr_test  ',
      profileId: '  prf_test  ',
    });

    expect(result).toEqual({
      accountId: 'acc_test',
      membershipId: 'mbr_test',
      profileId: 'prf_test',
    });
  });

  it('rejects empty membershipId', () => {
    expect(() =>
      assignProfileToMembershipInputSchema.parse({
        accountId: 'acc_test',
        membershipId: '   ',
        profileId: 'prf_test',
      })
    ).toThrow();
  });

  it('rejects empty profileId', () => {
    expect(() =>
      assignProfileToMembershipInputSchema.parse({
        accountId: 'acc_test',
        membershipId: 'mbr_test',
        profileId: '   ',
      })
    ).toThrow();
  });

  it('rejects empty accountId', () => {
    expect(() =>
      assignProfileToMembershipInputSchema.parse({
        accountId: '   ',
        membershipId: 'mbr_test',
        profileId: 'prf_test',
      })
    ).toThrow();
  });
});

describe('unassignProfileInputSchema', () => {
  it('normalizes valid input', () => {
    const result = unassignProfileInputSchema.parse({
      assignmentId: '  asg_test  ',
    });

    expect(result).toEqual({
      assignmentId: 'asg_test',
    });
  });

  it('rejects empty assignmentId', () => {
    expect(() =>
      unassignProfileInputSchema.parse({
        assignmentId: '   ',
      })
    ).toThrow();
  });
});

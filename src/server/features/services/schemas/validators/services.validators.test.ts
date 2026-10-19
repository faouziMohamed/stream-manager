import {
  createServiceInputSchema,
  updateServiceInputSchema,
} from '@/server/features/services/schemas/validators/services.validators';

describe('service validators', () => {
  it('normalizes valid create input', () => {
    const result = createServiceInputSchema.parse({
      category: 'video',
      name: '  Netflix  ',
      supportsProfiles: true,
    });

    expect(result).toEqual({
      category: 'video',
      name: 'Netflix',
      supportsProfiles: true,
    });
  });

  it('applies defaults for omitted create input fields', () => {
    const result = createServiceInputSchema.parse({
      name: 'Spotify',
    });

    expect(result).toEqual({
      category: 'video',
      name: 'Spotify',
      supportsProfiles: false,
    });
  });

  it('rejects an empty service name', () => {
    expect(() =>
      createServiceInputSchema.parse({
        category: 'video',
        name: '   ',
      })
    ).toThrow();
  });

  it('rejects a blank image key on create input', () => {
    expect(() =>
      createServiceInputSchema.parse({
        imageKey: '   ',
        name: 'Netflix',
      })
    ).toThrow();
  });

  it('requires update input to include at least one editable field', () => {
    expect(() =>
      updateServiceInputSchema.parse({
        id: 'svc_123',
      })
    ).toThrow();
  });

  it('normalizes and accepts nullable update input fields', () => {
    const result = updateServiceInputSchema.parse({
      descriptionContent: null,
      id: 'svc_123',
      imageKey: null,
      name: '  Deezer  ',
    });

    expect(result).toEqual({
      descriptionContent: null,
      id: 'svc_123',
      imageKey: null,
      name: 'Deezer',
    });
  });
});

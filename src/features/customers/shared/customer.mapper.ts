import type { CustomerFormValues } from './customer.schema';

export function toForm(dto?: CustomerFormSeed): CustomerFormValues {
  return {
    language: (dto?.language as 'en' | 'fr' | undefined) ?? 'fr',
    name: dto?.name ?? '',
    email: dto?.email ?? undefined,
    phone: dto?.phone ?? undefined,
    // Pass the stored Tiptap document straight through; the editor renders it.
    notes: dto?.notesContent ?? null,
  };
}

type CustomerFormSeed = {
  language?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  notesContent?: unknown;
};

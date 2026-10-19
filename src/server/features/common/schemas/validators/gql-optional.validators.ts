import { z } from 'zod';

// Every non-`!` GraphQL input field is nullable: clients legitimately send
// null for "not set" (and many generated clients always do). A plain Zod
// `.optional()` rejects null with BAD_USER_INPUT. Wrap optional input fields
// with this helper so null is coerced to undefined ("not provided").
//
// Do NOT use this for fields where null is meaningful (e.g. "clear this
// value") — model those explicitly with `.nullable()`.
export function gqlOptional<T extends z.ZodType>(schema: T) {
  return schema
    .nullish()
    .transform((v: z.output<T> | null | undefined) => v ?? undefined)
    .optional();
}

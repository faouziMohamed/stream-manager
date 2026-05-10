import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const accountSchema = z
  .object({
    serviceId: z.string().min(1, 'Service requis'),
    label: z.string().min(1, 'Libellé requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    supportsProfiles: z.boolean().default(true),
    maxProfiles: z
      .union([z.number(), z.string().transform(Number)])
      .pipe(z.number().int().min(1).max(20)),
    notes: z.string().optional(),
  })
  .refine((d) => !!(d.email || d.phone), {
    message: 'Au moins un email ou un numéro de téléphone est requis',
    path: ['email'],
  });

export const profileSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  profileIndex: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(1)),
  pin: z.string().optional().or(z.literal('')),
});

export const assignSchema = z.object({
  subscriptionId: z.string().min(1, 'Abonnement requis'),
});

export type AccountFormInput = z.input<typeof accountSchema>;
export type AccountForm = z.output<typeof accountSchema>;
export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileForm = z.output<typeof profileSchema>;
export type AssignForm = z.infer<typeof assignSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const statusColors: Record<string, string> = {
  active: 'bg-primary/10 text-primary border-primary/20',
  expired: 'bg-muted text-muted-foreground',
  paused: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  cancelled: 'bg-destructive/10 text-destructive',
};

export const statusLabels: Record<string, string> = {
  active: 'Actif',
  expired: 'Expiré',
  paused: 'En pause',
  cancelled: 'Annulé',
};

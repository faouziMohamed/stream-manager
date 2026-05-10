import { z } from 'zod';

export const promotionSchema = z
  .object({
    name: z.string().min(1, 'Nom requis'),
    description: z.string().optional(),
    serviceMode: z.enum(['existing', 'new']),
    serviceIds: z.array(z.string()),
    newServiceName: z.string().optional(),
    newServiceCategory: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    showOnHomepage: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.serviceMode === 'existing' && data.serviceIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['serviceIds'],
        message: 'Sélectionnez au moins un service',
      });
    }
    if (data.serviceMode === 'new' && !data.newServiceName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['newServiceName'],
        message: 'Nom du service requis',
      });
    }
  });

export type PromotionForm = z.infer<typeof promotionSchema>;

export interface ServiceItem {
  id: string;
  name: string;
}

export interface PromotionDialogProps {
  open: boolean;
  promotion: {
    id: string;
    name: string;
    description?: string | null;
    services?: ServiceItem[] | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    showOnHomepage?: boolean | null;
  } | null;
  allServices: ServiceItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromotionForm) => Promise<void>;
}

export function toForm(
  promotion: {
    name: string;
    description?: string | null;
    services?: ServiceItem[] | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    showOnHomepage?: boolean | null;
  } | null
): PromotionForm {
  return {
    name: promotion?.name ?? '',
    description: promotion?.description ?? '',
    serviceMode: 'existing',
    serviceIds: promotion?.services?.map((s) => s.id) ?? [],
    startsAt: promotion?.startsAt ?? undefined,
    expiresAt: promotion?.expiresAt ?? undefined,
    showOnHomepage: promotion?.showOnHomepage ?? true,
  };
}

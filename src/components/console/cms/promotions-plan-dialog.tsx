"use client";

import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/ui/form-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const planSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  durationMonths: z.coerce.number().min(1, "Durée minimale 1 mois"),
  price: z.coerce.number().min(0, "Prix invalide"),
  currencyCode: z.string().min(1),
});

type PlanForm = z.infer<typeof planSchema>;

function toForm(
  plan: {
    name: string;
    durationMonths: number;
    price: number;
    currencyCode: string;
  } | null,
  defaultCurrency: string,
): PlanForm {
  return {
    name: plan?.name ?? "",
    durationMonths: plan?.durationMonths ?? 1,
    price: plan?.price ?? 0,
    currencyCode: plan?.currencyCode ?? defaultCurrency,
  };
}

interface PlanDialogProps {
  open: boolean;
  plan: {
    id: string;
    name: string;
    durationMonths: number;
    price: number;
    currencyCode: string;
  } | null;
  defaultCurrency: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanForm) => Promise<void>;
}

export function PlanDialog({
  open,
  plan,
  defaultCurrency,
  onOpenChange,
  onSubmit,
}: PlanDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema) as Resolver<PlanForm>,
    defaultValues: toForm(null, defaultCurrency),
  });

  useEffect(() => {
    if (open) reset(toForm(plan, defaultCurrency));
  }, [open, plan, defaultCurrency, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {plan ? "Modifier la formule" : "Nouvelle formule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Nom" required error={errors.name?.message}>
            <Input placeholder="ex: 1 mois" {...register("name")} />
          </FormGroup>
          <div className="grid grid-cols-3 gap-3">
            <FormGroup
              label="Durée (mois)"
              required
              error={errors.durationMonths?.message}
            >
              <Input type="number" min={1} {...register("durationMonths")} />
            </FormGroup>
            <FormGroup label="Prix" required error={errors.price?.message}>
              <Input type="number" step="0.01" min={0} {...register("price")} />
            </FormGroup>
            <FormGroup
              label="Devise"
              required
              error={errors.currencyCode?.message}
            >
              <Input placeholder="MAD" {...register("currencyCode")} />
            </FormGroup>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

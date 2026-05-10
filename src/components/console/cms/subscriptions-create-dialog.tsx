"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatCurrency } from "@/lib/utils/helpers";
import type { PlanDto } from "@/lib/graphql/operations/plans.operations";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { ClientDto } from "@/lib/graphql/operations/clients.operations";
import type { PromotionDto } from "@/lib/graphql/operations/promotions.operations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateForm {
  clientId: string;
  planId: string;
  startDate: string;
  isRecurring: boolean;
  notes?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientDto[];
  services: ServiceDto[];
  promotions: PromotionDto[];
  plans: PlanDto[];
  onSubmit: (data: CreateForm) => Promise<void>;
}

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  clients,
  services,
  promotions,
  plans,
  onSubmit,
}: CreateDialogProps) {
  const form = useForm<CreateForm>({
    resolver: zodResolver(
      z.object({
        clientId: z.string().min(1, "Client requis"),
        planId: z.string().min(1, "Formule requise"),
        startDate: z.string().min(1, "Date de début requise"),
        isRecurring: z.boolean(),
        notes: z.string().optional(),
      }),
    ),
    defaultValues: { isRecurring: false },
  });

  const handleSubmit = async (data: CreateForm) => {
    await onSubmit(data);
    form.reset({ isRecurring: false });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset({ isRecurring: false });
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel abonnement</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormGroup
            label="Client"
            required
            hint="Sélectionnez le client à qui attribuer l'abonnement"
            error={form.formState.errors.clientId?.message}
          >
            <Select onValueChange={(v) => form.setValue("clientId", v)}>
              <SelectTrigger error={form.formState.errors.clientId?.message}>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>
          <FormGroup
            label="Formule"
            required
            hint="Choisissez la formule et la durée d'abonnement"
            error={form.formState.errors.planId?.message}
          >
            <Select onValueChange={(v) => form.setValue("planId", v)}>
              <SelectTrigger error={form.formState.errors.planId?.message}>
                <SelectValue placeholder="Sélectionner une formule" />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => {
                  const svcPlans = plans.filter((p) => p.serviceId === svc.id);
                  if (svcPlans.length === 0) return null;
                  return (
                    <SelectGroup key={svc.id}>
                      <SelectLabel>{svc.name}</SelectLabel>
                      {svcPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.durationMonths} mois —{" "}
                          {formatCurrency(p.price, p.currencyCode)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
                {promotions.map((promo) => {
                  const promoPlans = plans.filter(
                    (p) => p.promotionId === promo.id,
                  );
                  if (promoPlans.length === 0) return null;
                  return (
                    <SelectGroup key={promo.id}>
                      <SelectLabel>[Promo] {promo.name}</SelectLabel>
                      {promoPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.durationMonths} mois —{" "}
                          {formatCurrency(p.price, p.currencyCode)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </FormGroup>
          <FormGroup
            label="Date de début"
            required
            hint="Date à laquelle l'abonnement commence"
            error={form.formState.errors.startDate?.message}
          >
            <DatePicker
              value={form.watch("startDate") || undefined}
              onChange={(v) => form.setValue("startDate", v ?? "")}
            />
          </FormGroup>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                Abonnement récurrent
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Un renouvellement sera suggéré à l&apos;expiration</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <p className="text-xs text-muted-foreground">
                Un renouvellement sera suggéré à l&apos;expiration
              </p>
            </div>
            <Switch
              checked={form.watch("isRecurring")}
              onCheckedChange={(v) => form.setValue("isRecurring", v)}
            />
          </div>
          <FormGroup
            label="Notes"
            hint="Notes internes visibles uniquement par les administrateurs"
          >
            <Textarea
              placeholder="Notes internes…"
              rows={2}
              {...form.register("notes")}
            />
          </FormGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect } from "react";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormGroup } from "@/components/ui/form-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const promotionSchema = z
  .object({
    name: z.string().min(1, "Nom requis"),
    description: z.string().optional(),
    serviceMode: z.enum(["existing", "new"]),
    serviceIds: z.array(z.string()),
    newServiceName: z.string().optional(),
    newServiceCategory: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    showOnHomepage: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.serviceMode === "existing" && data.serviceIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceIds"],
        message: "Sélectionnez au moins un service",
      });
    }
    if (data.serviceMode === "new" && !data.newServiceName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["newServiceName"],
        message: "Nom du service requis",
      });
    }
  });

export type PromotionForm = z.infer<typeof promotionSchema>;

interface ServiceItem {
  id: string;
  name: string;
}

interface PromotionDialogProps {
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

function toForm(
  promotion: {
    name: string;
    description?: string | null;
    services?: ServiceItem[] | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    showOnHomepage?: boolean | null;
  } | null,
): PromotionForm {
  return {
    name: promotion?.name ?? "",
    description: promotion?.description ?? "",
    serviceMode: "existing",
    serviceIds: promotion?.services?.map((s) => s.id) ?? [],
    startsAt: promotion?.startsAt ?? undefined,
    expiresAt: promotion?.expiresAt ?? undefined,
    showOnHomepage: promotion?.showOnHomepage ?? true,
  };
}

export function PromotionDialog({
  open,
  promotion,
  allServices,
  onOpenChange,
  onSubmit,
}: PromotionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PromotionForm>({
    resolver: zodResolver(promotionSchema) as Resolver<PromotionForm>,
    defaultValues: {
      serviceMode: "existing",
      serviceIds: [],
      showOnHomepage: true,
    },
  });

  useEffect(() => {
    if (open) reset(toForm(promotion));
  }, [open, promotion, reset]);

  const isEditing = !!promotion;
  const serviceMode = useWatch({ control, name: "serviceMode" });
  const selectedIds = useWatch({ control, name: "serviceIds" }) ?? [];

  const toggleService = (id: string) => {
    setValue(
      "serviceIds",
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Modifier la promotion" : "Nouvelle promotion"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Nom" required error={errors.name?.message}>
            <Input
              placeholder="ex: Netflix + Shahid VIP"
              {...register("name")}
            />
          </FormGroup>

          <FormGroup label="Description" error={errors.description?.message}>
            <Textarea
              placeholder="Description…"
              rows={2}
              {...register("description")}
            />
          </FormGroup>

          {!isEditing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Services inclus *</p>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setValue("serviceMode", "existing")}
                  className={`px-3 py-1.5 rounded border transition-colors ${serviceMode === "existing" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                >
                  Choisir existant
                </button>
                <button
                  type="button"
                  onClick={() => setValue("serviceMode", "new")}
                  className={`px-3 py-1.5 rounded border transition-colors ${serviceMode === "new" ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                >
                  Créer un nouveau
                </button>
              </div>

              {serviceMode === "existing" ? (
                <>
                  {errors.serviceIds && (
                    <p className="text-xs text-destructive">
                      {errors.serviceIds.message}
                    </p>
                  )}
                  {allServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun service disponible.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {allServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`text-left text-sm px-2 py-1.5 rounded border transition-colors ${selectedIds.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  <FormGroup
                    label="Nom du service"
                    required
                    error={errors.newServiceName?.message}
                  >
                    <Input
                      placeholder="ex: Disney+"
                      {...register("newServiceName")}
                    />
                  </FormGroup>
                  <FormGroup label="Catégorie">
                    <Input
                      placeholder="streaming"
                      defaultValue="streaming"
                      {...register("newServiceCategory")}
                    />
                  </FormGroup>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <FormGroup
              label="Services inclus"
              error={errors.serviceIds?.message}
            >
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {allServices.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`text-left text-sm px-2 py-1.5 rounded border transition-colors ${selectedIds.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </FormGroup>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Période de validité</p>
            <div className="space-y-2">
              <FormGroup label="Date de début" hint="Optionnel">
                <DateTimePicker
                  value={useWatch({ control, name: "startsAt" })}
                  onChange={(v) => setValue("startsAt", v)}
                  placeholder="Début de la promotion…"
                />
              </FormGroup>
              <FormGroup label="Date d'expiration" hint="Optionnel">
                <DateTimePicker
                  value={useWatch({ control, name: "expiresAt" })}
                  onChange={(v) => setValue("expiresAt", v)}
                  placeholder="Expiration de la promotion…"
                />
              </FormGroup>
            </div>
            <p className="text-xs text-muted-foreground">
              Une promotion expirée ne s&apos;affiche plus sur la page publique.
              Les abonnements existants restent actifs.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Afficher sur la page d&apos;accueil
              </p>
              <p className="text-xs text-muted-foreground">
                Cette promotion sera visible par les visiteurs
              </p>
            </div>
            <Controller
              name="showOnHomepage"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
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

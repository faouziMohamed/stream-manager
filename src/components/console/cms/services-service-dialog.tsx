"use client";

import { useRef } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LogoUploader } from "./services-logo-uploader";
import { useDeleteFromCloudinary } from "@/lib/hooks/queries/use-settings.queries";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const serviceSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  category: z.string().min(1, "Catégorie requise"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  showOnHomepage: z.boolean().default(true),
});

export type ServiceForm = z.infer<typeof serviceSchema>;

function toForm(service?: ServiceDto): ServiceForm {
  return {
    name: service?.name ?? "",
    category: service?.category ?? "streaming",
    description: service?.description ?? "",
    logoUrl: service?.logoUrl ?? "",
    showOnHomepage: service?.showOnHomepage ?? true,
  };
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────

interface ServiceDialogProps {
  open: boolean;
  service?: ServiceDto;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceForm) => Promise<void>;
}

export function ServiceDialog({
  open,
  service,
  onOpenChange,
  onSubmit,
}: ServiceDialogProps) {
  const deleteFromCloudinary = useDeleteFromCloudinary();
  const pendingLogoRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceForm>,
    values: toForm(service),
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && pendingLogoRef.current) {
      deleteFromCloudinary.mutate(pendingLogoRef.current);
      pendingLogoRef.current = null;
    }
    onOpenChange(open);
  };

  const handleLogoUploaded = (publicId: string) => {
    pendingLogoRef.current = publicId;
  };

  const handleLogoCleared = () => {
    if (pendingLogoRef.current) {
      deleteFromCloudinary.mutate(pendingLogoRef.current);
      pendingLogoRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup
            label="Nom"
            required
            hint="Nom du service tel qu'affiché aux clients"
            error={errors.name?.message}
          >
            <Input placeholder="ex: Netflix" {...register("name")} />
          </FormGroup>
          <FormGroup
            label="Catégorie"
            required
            hint="Catégorie pour organiser les services (ex: streaming, sport)"
            error={errors.category?.message}
          >
            <Input placeholder="ex: streaming" {...register("category")} />
          </FormGroup>
          <FormGroup
            label="Description"
            hint="Description visible sur la page d'accueil"
          >
            <Textarea
              placeholder="Description du service…"
              rows={2}
              {...register("description")}
            />
          </FormGroup>
          <div className="space-y-1.5">
            <Label>Logo du service</Label>
            <Controller
              name="logoUrl"
              control={control}
              render={({ field }) => (
                <LogoUploader
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onUploaded={handleLogoUploaded}
                  onCleared={handleLogoCleared}
                />
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Afficher sur la page d&apos;accueil
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      Les services masqués restent accessibles via lien direct
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <p className="text-xs text-muted-foreground">
                Ce service sera visible par les visiteurs
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
              onClick={() => handleOpenChange(false)}
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

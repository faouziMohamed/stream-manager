"use client";

import { useCallback, useRef, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { formatCurrency } from "@/lib/utils/helpers";
import {
  useCreatePlan,
  useCreateService,
  useDeletedServices,
  useDeletePlan,
  useDeleteService,
  usePlans,
  useRestoreService,
  useServices,
  useUpdatePlan,
  useUpdateService,
} from "@/lib/hooks/queries/use-services.queries";
import {
  useDeleteFromCloudinary,
  useUploadToCloudinary,
} from "@/lib/hooks/queries/use-settings.queries";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { PlanDto } from "@/lib/graphql/operations/plans.operations";

// ─── Logo uploader ────────────────────────────────────────────────────────────

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (publicId: string) => void;
  onCleared?: () => void;
}

function LogoUploader({
  value,
  onChange,
  onUploaded,
  onCleared,
}: LogoUploaderProps) {
  const uploadMutation = useUploadToCloudinary();
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the publicId of the currently displayed upload so we can delete it on ✕
  const currentPublicId = useRef<string | null>(null);

  const readBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const base64 = await readBase64(file);
      const result = await uploadMutation.mutateAsync({
        base64,
        filename: `logos/${file.name}`,
      });
      if (result.success && result.url) {
        onChange(result.url);
        if (result.publicId) {
          currentPublicId.current = result.publicId;
          onUploaded?.(result.publicId);
        }
      }
    },
    [uploadMutation, onChange, onUploaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const isUploading = uploadMutation.isPending;

  if (value) {
    // Strip path, extension, and Cloudinary's _timestamp suffix for a clean display label
    const raw = value.split("/").pop()?.split("?")[0] ?? "logo";
    const filename = raw.replace(/\.[^.]+$/, "").replace(/_\d{10,}$/, "");

    const handleCopy = () => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    return (
      <div className="flex items-center gap-2 w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30 px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="logo"
          className="h-10 w-10 rounded-md object-cover border bg-background shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={value}>
            {filename}
          </p>
          <p className="text-xs text-muted-foreground">
            Logo uploadé sur Cloudinary
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Copier l'URL"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive cursor-pointer"
          title="Supprimer le logo"
          onClick={() => {
            currentPublicId.current = null;
            onCleared?.();
            onChange("");
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors select-none
                ${isUploading ? "cursor-wait" : "cursor-pointer"}
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Téléversement…</span>
        </>
      ) : (
        <>
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Glisser ou <span className="text-primary underline">parcourir</span>
          </span>
          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  category: z.string().min(1, "Catégorie requise"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  showOnHomepage: z.boolean().default(true),
});

const planSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  durationMonths: z.coerce.number().min(1, "Durée minimale 1 mois"),
  price: z.coerce.number().min(0, "Prix invalide"),
  currencyCode: z.string().min(1, "Devise requise"),
  planType: z.enum(["full", "partial", "custom", "bundle"]),
  description: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;
type PlanForm = {
  name: string;
  durationMonths: number;
  price: number;
  currencyCode: string;
  planType: "full" | "partial" | "custom" | "bundle";
  description?: string;
};

const planTypeLabels: Record<string, string> = {
  full: "Complet",
  partial: "Partiel",
  custom: "Personnalisé",
  bundle: "Offre groupée",
};

// ─── Plan sub-table ───────────────────────────────────────────────────────────

function PlansTable({
  serviceId,
  currency,
}: {
  serviceId: string;
  currency: string;
}) {
  const { data: plans = [] } = usePlans(serviceId);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [planDialog, setPlanDialog] = useState<{
    open: boolean;
    plan?: PlanDto;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema) as Resolver<PlanForm>,
    defaultValues: { currencyCode: currency, planType: "full" },
  });

  const openCreate = () => {
    reset({ currencyCode: currency, planType: "full" });
    setPlanDialog({ open: true });
  };
  const openEdit = (plan: PlanDto) => {
    reset({
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price,
      currencyCode: plan.currencyCode,
      planType: plan.planType as PlanForm["planType"],
      description: plan.description ?? "",
    });
    setPlanDialog({ open: true, plan });
  };

  const onSubmit = async (data: PlanForm) => {
    if (planDialog.plan) {
      await updatePlan.mutateAsync({ id: planDialog.plan.id, input: data });
    } else {
      await createPlan.mutateAsync({ ...data, serviceId });
    }
    setPlanDialog({ open: false });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Formules
        </p>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter
        </Button>
      </div>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucune formule</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.durationMonths} mois</TableCell>
                <TableCell>
                  {formatCurrency(plan.price, plan.currencyCode)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {planTypeLabels[plan.planType] ?? plan.planType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteTarget(plan.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={planDialog.open}
        onOpenChange={(o) => setPlanDialog({ open: o })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {planDialog.plan ? "Modifier la formule" : "Nouvelle formule"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nom</Label>
                <Input placeholder="ex: 3 mois" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Durée (mois)</Label>
                <Input type="number" min={1} {...register("durationMonths")} />
                {errors.durationMonths && (
                  <p className="text-xs text-destructive">
                    {errors.durationMonths.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Prix</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-xs text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Devise</Label>
                <Input placeholder="MAD" {...register("currencyCode")} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  defaultValue="full"
                  onValueChange={(v) =>
                    setValue("planType", v as PlanForm["planType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Complet</SelectItem>
                    <SelectItem value="partial">Partiel</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description (optionnel)</Label>
                <Input
                  placeholder="Détails supplémentaires…"
                  {...register("description")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanDialog({ open: false })}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer la formule"
        description="Cette action est irréversible. Les abonnements existants ne seront pas supprimés."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePlan.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deletePlan.isPending}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialData?: ServiceDto[];
  defaultCurrency?: string;
}

export function ServicesEditor({
  initialData,
  defaultCurrency = "MAD",
}: Props) {
  const { data: services = [] } = useServices(initialData);
  const { data: deletedServices = [] } = useDeletedServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const restoreService = useRestoreService();
  const deleteFromCloudinary = useDeleteFromCloudinary();

  const [dialog, setDialog] = useState<{ open: boolean; service?: ServiceDto }>(
    { open: false },
  );
  // soft-delete confirm
  const [softDeleteTarget, setSoftDeleteTarget] = useState<ServiceDto | null>(
    null,
  );
  // hard-delete confirm
  const [hardDeleteTarget, setHardDeleteTarget] = useState<ServiceDto | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingLogoPublicId, setPendingLogoPublicId] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceForm>,
  });

  const cleanupPendingLogo = useCallback(
    (publicId: string | null) => {
      if (publicId) deleteFromCloudinary.mutate(publicId);
    },
    [deleteFromCloudinary],
  );

  const handleLogoUploaded = useCallback((publicId: string) => {
    setPendingLogoPublicId(publicId);
  }, []);

  const handleLogoCleared = useCallback(() => {
    if (pendingLogoPublicId) {
      deleteFromCloudinary.mutate(pendingLogoPublicId);
      setPendingLogoPublicId(null);
    }
  }, [pendingLogoPublicId, deleteFromCloudinary]);

  const openCreate = () => {
    setPendingLogoPublicId(null);
    reset({ category: "streaming", showOnHomepage: true });
    setDialog({ open: true });
  };
  const openEdit = (s: ServiceDto) => {
    setPendingLogoPublicId(null);
    reset({
      name: s.name,
      category: s.category,
      description: s.description ?? "",
      logoUrl: s.logoUrl ?? "",
      showOnHomepage: s.showOnHomepage ?? true,
    });
    setDialog({ open: true, service: s });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) cleanupPendingLogo(pendingLogoPublicId);
    setDialog({ open });
    if (!open) setPendingLogoPublicId(null);
  };

  const onSubmit = async (data: ServiceForm) => {
    const payload = {
      ...data,
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
    };
    if (dialog.service) {
      await updateService.mutateAsync({
        id: dialog.service.id,
        input: payload,
      });
    } else {
      await createService.mutateAsync(payload);
    }
    setPendingLogoPublicId(null);
    setDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos services et leurs formules tarifaires
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau service
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Actifs
            {services.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {services.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Supprimés
            {deletedServices.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {deletedServices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Active services ── */}
        <TabsContent value="active" className="space-y-2 mt-4">
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun service. Créez-en un pour commencer.
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card
                key={service.id}
                className={service.isActive ? "" : "opacity-60"}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === service.id ? null : service.id,
                        )
                      }
                    >
                      {expandedId === service.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {service.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={service.logoUrl}
                          alt=""
                          className="h-6 w-6 rounded object-cover shrink-0 bg-muted/40"
                        />
                      )}
                      {service.name}
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                      {!service.isActive && (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                      {service.showOnHomepage === false && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground gap-1"
                        >
                          <EyeOff className="h-3 w-3" />
                          Masqué
                        </Badge>
                      )}
                    </button>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => openEdit(service)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive cursor-pointer"
                        onClick={() => setSoftDeleteTarget(service)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {service.description}
                    </p>
                  )}
                </CardHeader>
                {expandedId === service.id && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <PlansTable
                      serviceId={service.id}
                      currency={defaultCurrency}
                    />
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Deleted services ── */}
        <TabsContent value="deleted" className="space-y-2 mt-4">
          {deletedServices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun service archivé.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  La suppression définitive d&apos;un service effacera également
                  toutes ses formules et tous les abonnements associés. Cette
                  action est irréversible.
                </span>
              </div>
              {deletedServices.map((service) => (
                <Card key={service.id} className="opacity-70 border-dashed">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        {service.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.logoUrl}
                            alt=""
                            className="h-6 w-6 rounded object-cover shrink-0 bg-muted/40 grayscale"
                          />
                        )}
                        {service.name}
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Archivé
                        </Badge>
                        {service.deletedAt && (
                          <span className="text-xs text-muted-foreground">
                            le{" "}
                            {new Date(service.deletedAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 cursor-pointer gap-1.5"
                          onClick={() => restoreService.mutate(service.id)}
                          disabled={restoreService.isPending}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurer
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive cursor-pointer"
                          onClick={() => setHardDeleteTarget(service)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Service create/edit dialog ── */}
      <Dialog open={dialog.open} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.service ? "Modifier le service" : "Nouveau service"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input placeholder="ex: Netflix" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie *</Label>
              <Input placeholder="ex: streaming" {...register("category")} />
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Description du service…"
                rows={2}
                {...register("description")}
              />
            </div>
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
                onClick={() => handleDialogOpenChange(false)}
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

      {/* ── Soft-delete confirm (first step) ── */}
      <ConfirmDialog
        open={!!softDeleteTarget}
        onOpenChange={(o) => !o && setSoftDeleteTarget(null)}
        title="Archiver le service"
        description={
          <span className="space-y-2 block">
            <span className="block">
              Le service <strong>{softDeleteTarget?.name}</strong> sera archivé
              et n&apos;apparaîtra plus dans la liste principale ni sur le site
              public.
            </span>
            <span className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Les formules et abonnements existants sont conservés. Vous
                pourrez restaurer ce service depuis l&apos;onglet{" "}
                <em>Supprimés</em>.
              </span>
            </span>
          </span>
        }
        confirmLabel="Archiver"
        onConfirm={async () => {
          if (softDeleteTarget) {
            await deleteService.mutateAsync({ id: softDeleteTarget.id });
            setSoftDeleteTarget(null);
          }
        }}
        loading={deleteService.isPending}
      />

      {/* ── Hard-delete confirm (second step, destructive) ── */}
      <ConfirmDialog
        open={!!hardDeleteTarget}
        onOpenChange={(o) => !o && setHardDeleteTarget(null)}
        title="Suppression définitive"
        description={
          <span className="space-y-2 block">
            <span className="block">
              Vous êtes sur le point de supprimer{" "}
              <strong>définitivement</strong> le service{" "}
              <strong>{hardDeleteTarget?.name}</strong>.
            </span>
            <span className="flex items-start gap-1.5 text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Toutes les formules et tous les abonnements liés à ce service
                seront également supprimés. Cette action est{" "}
                <strong>irréversible</strong>.
              </span>
            </span>
          </span>
        }
        confirmLabel="Supprimer définitivement"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (hardDeleteTarget) {
            await deleteService.mutateAsync({
              id: hardDeleteTarget.id,
              force: true,
            });
            setHardDeleteTarget(null);
          }
        }}
        loading={deleteService.isPending}
      />
    </div>
  );
}

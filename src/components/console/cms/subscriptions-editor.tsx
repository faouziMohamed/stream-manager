"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Pencil, Plus, RefreshCw, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {ConfirmDialog} from "@/components/console/confirm-dialog";
import {DatePicker} from "@/components/ui/date-picker";
import {
    useCreateSubscription,
    useDeleteSubscription,
    useRenewSubscription,
    useSubscriptions,
    useUpdateSubscription,
} from "@/lib/hooks/queries/use-subscriptions.queries";
import {useClients} from "@/lib/hooks/queries/use-clients.queries";
import {usePlans, useServices,} from "@/lib/hooks/queries/use-services.queries";
import {usePromotions} from "@/lib/hooks/queries/use-promotions.queries";
import type {SubscriptionDto} from "@/lib/graphql/operations/subscriptions.operations";
import type {PlanDto} from "@/lib/graphql/operations/plans.operations";
import type {ServiceDto} from "@/lib/graphql/operations/services.operations";
import type {ClientDto} from "@/lib/graphql/operations/clients.operations";
import type {PromotionDto} from "@/lib/graphql/operations/promotions.operations";
import {Label} from "@/components/ui/label";
import {formatCurrency} from "@/lib/utils/helpers";

const statusLabels: Record<string, string> = {
    active: "Actif",
    expired: "Expiré",
    paused: "Suspendu",
    cancelled: "Annulé",
};

const statusVariants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    active: "default",
    expired: "secondary",
    paused: "outline",
    cancelled: "destructive",
};

const createSchema = z.object({
    clientId: z.string().min(1, "Client requis"),
    planId: z.string().min(1, "Formule requise"),
    startDate: z.string().min(1, "Date de début requise"),
    isRecurring: z.boolean(),
    notes: z.string().optional(),
});

const renewSchema = z.object({
    startDate: z.string().min(1, "Date de début requise"),
    isRecurring: z.boolean(),
    notes: z.string().optional(),
});

const updateSchema = z.object({
    status: z.enum(["active", "expired", "paused", "cancelled"]),
    isRecurring: z.boolean(),
    notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type RenewForm = z.infer<typeof renewSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

interface Props {
    initialData?: SubscriptionDto[];
    initialPlans?: PlanDto[];
    initialServices?: ServiceDto[];
    initialClients?: ClientDto[];
    initialPromotions?: PromotionDto[];
    defaultCurrency?: string;
}

export function SubscriptionsEditor({
                                        initialData,
                                        initialPlans,
                                        initialServices,
                                        initialClients,
                                        initialPromotions,
                                        defaultCurrency = "MAD",
                                    }: Props) {
    const {data: subscriptions = []} = useSubscriptions(undefined, initialData);
    const {data: clients = []} = useClients(initialClients);
    const {data: servicePlans = []} = usePlans(undefined, initialPlans);
    const {data: services = []} = useServices(initialServices);
    const {data: promotions = []} = usePromotions(initialPromotions);
    const createSubscription = useCreateSubscription();
    const updateSubscription = useUpdateSubscription();
    const deleteSubscription = useDeleteSubscription();
    const renewSubscription = useRenewSubscription();

    const [createDialog, setCreateDialog] = useState(false);
    const [updateDialog, setUpdateDialog] = useState<{
        open: boolean;
        sub?: SubscriptionDto;
    }>({open: false});
    const [renewDialog, setRenewDialog] = useState<{
        open: boolean;
        sub?: SubscriptionDto;
    }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const createForm = useForm<CreateForm>({
        resolver: zodResolver(createSchema),
        defaultValues: {isRecurring: false},
    });
    const updateForm = useForm<UpdateForm>({
        resolver: zodResolver(updateSchema),
    });
    const renewForm = useForm<RenewForm>({
        resolver: zodResolver(renewSchema),
        defaultValues: {isRecurring: false},
    });

    // Build plan options: service plans + promotion plans
    const allPlans = servicePlans;
    const getPlanLabel = (planId: string) => {
        const plan = allPlans.find((p) => p.id === planId);
        if (!plan) return planId;
        const parent = plan.serviceId
            ? services.find((s) => s.id === plan.serviceId)?.name
            : promotions.find((p) => p.id === plan.promotionId)?.name;
        return `${parent ?? "?"} — ${plan.durationMonths} mois — ${formatCurrency(plan.price, plan.currencyCode)}`;
    };

    const filtered = statusFilter === 'all'
        ? subscriptions
        : subscriptions.filter((s) => s.status === statusFilter);

    const onCreateSubmit = async (data: CreateForm) => {
        await createSubscription.mutateAsync(data);
        setCreateDialog(false);
        createForm.reset();
    };

    const onUpdateSubmit = async (data: UpdateForm) => {
        if (!updateDialog.sub) return;
        await updateSubscription.mutateAsync({
            id: updateDialog.sub.id,
            input: data,
        });
        setUpdateDialog({open: false});
    };

    const onRenewSubmit = async (data: RenewForm) => {
        if (!renewDialog.sub) return;
        await renewSubscription.mutateAsync({
            subscriptionId: renewDialog.sub.id,
            ...data,
        });
        setRenewDialog({open: false});
        renewForm.reset();
    };

    const openUpdate = (sub: SubscriptionDto) => {
        updateForm.reset({
            status: sub.status as UpdateForm["status"],
            isRecurring: sub.isRecurring,
            notes: sub.notes ?? "",
        });
        setUpdateDialog({open: true, sub});
    };

    const openRenew = (sub: SubscriptionDto) => {
        renewForm.reset({
            startDate: new Date().toISOString().slice(0, 10),
            isRecurring: sub.isRecurring,
        });
        setRenewDialog({open: true, sub});
    };

    const getClientName = (clientId: string) =>
        clients.find((c) => c.id === clientId)?.name ?? "—";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Abonnements</h1>
                    <p className="text-muted-foreground text-sm">
                        {subscriptions.length} abonnement
                        {subscriptions.length !== 1 ? "s" : ""} au total
                    </p>
                </div>
                <Button
                    onClick={() => {
                        createForm.reset({isRecurring: false});
                        setCreateDialog(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2"/>
                    Nouvel abonnement
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {["all", "active", "expired", "paused", "cancelled"].map((s) => (
                    <Button
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? "default" : "outline"}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === "all" ? "Tous" : statusLabels[s]}
                    </Button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Aucun abonnement.
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Formule</TableHead>
                                <TableHead>Début</TableHead>
                                <TableHead>Fin</TableHead>
                                <TableHead>Récurrent</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="w-28"/>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">
                                        {sub.client?.name ?? getClientName(sub.clientId)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {getPlanLabel(sub.planId)}
                                    </TableCell>
                                    <TableCell>{sub.startDate}</TableCell>
                                    <TableCell>{sub.endDate}</TableCell>
                                    <TableCell>{sub.isRecurring ? "Oui" : "Non"}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariants[sub.status] ?? "secondary"}>
                                            {statusLabels[sub.status] ?? sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                onClick={() => openUpdate(sub)}
                                                title="Modifier"
                                            >
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-primary"
                                                onClick={() => openRenew(sub)}
                                                title="Renouveler"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => setDeleteTarget(sub.id)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Create dialog */}
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nouvel abonnement</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={createForm.handleSubmit(onCreateSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <Label>Client *</Label>
                            <Select onValueChange={(v) => createForm.setValue("clientId", v)}>
                                <SelectTrigger
                                    error={createForm.formState.errors.clientId?.message}
                                >
                                    <SelectValue placeholder="Sélectionner un client"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {createForm.formState.errors.clientId && (
                                <p className="text-xs text-destructive">
                                    {createForm.formState.errors.clientId.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Formule *</Label>
                            <Select onValueChange={(v) => createForm.setValue("planId", v)}>
                                <SelectTrigger
                                    error={createForm.formState.errors.planId?.message}
                                >
                                    <SelectValue placeholder="Sélectionner une formule"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map((svc) => {
                                        const svcPlans = allPlans.filter(
                                            (p) => p.serviceId === svc.id,
                                        );
                                        if (svcPlans.length === 0) return null;
                                        return (
                                            <SelectGroup key={svc.id}>
                                                <SelectLabel>{svc.name}</SelectLabel>
                                                {svcPlans.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.durationMonths} mois
                                                        — {formatCurrency(p.price, p.currencyCode)}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        );
                                    })}
                                    {promotions.map((promo) => {
                                        const promoPlans = allPlans.filter(
                                            (p) => p.promotionId === promo.id,
                                        );
                                        if (promoPlans.length === 0) return null;
                                        return (
                                            <SelectGroup key={promo.id}>
                                                <SelectLabel>[Promo] {promo.name}</SelectLabel>
                                                {promoPlans.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.durationMonths} mois
                                                        — {formatCurrency(p.price, p.currencyCode)}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {createForm.formState.errors.planId && (
                                <p className="text-xs text-destructive">
                                    {createForm.formState.errors.planId.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date de début *</Label>
                            <DatePicker
                                value={createForm.watch("startDate") || undefined}
                                onChange={(v) => createForm.setValue("startDate", v ?? "")}
                            />
                            {createForm.formState.errors.startDate && (
                                <p className="text-xs text-destructive">
                                    {createForm.formState.errors.startDate.message}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurring"
                                {...createForm.register("isRecurring")}
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="isRecurring" className="cursor-pointer">
                                Abonnement récurrent (renouvellement suggéré à
                                l&apos;expiration)
                            </Label>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Notes internes…"
                                rows={2}
                                {...createForm.register("notes")}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialog(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.formState.isSubmitting}
                            >
                                {createForm.formState.isSubmitting ? "Création…" : "Créer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Update dialog */}
            <Dialog
                open={updateDialog.open}
                onOpenChange={(o) => setUpdateDialog({open: o})}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <Label>Statut</Label>
                            <Select
                                defaultValue={updateDialog.sub?.status}
                                onValueChange={(v) =>
                                    updateForm.setValue("status", v as UpdateForm["status"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="paused">Suspendu</SelectItem>
                                    <SelectItem value="cancelled">Annulé</SelectItem>
                                    <SelectItem value="expired">Expiré</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurringEdit"
                                {...updateForm.register("isRecurring")}
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="isRecurringEdit" className="cursor-pointer">
                                Récurrent
                            </Label>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea rows={2} {...updateForm.register("notes")} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUpdateDialog({open: false})}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateForm.formState.isSubmitting}
                            >
                                {updateForm.formState.isSubmitting
                                    ? "Enregistrement…"
                                    : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Renew dialog */}
            <Dialog
                open={renewDialog.open}
                onOpenChange={(o) => setRenewDialog({open: o})}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Renouveler l&apos;abonnement</DialogTitle>
                    </DialogHeader>
                    {renewDialog.sub && (
                        <p className="text-sm text-muted-foreground">
                            Formule actuelle : {getPlanLabel(renewDialog.sub.planId)}
                        </p>
                    )}
                    <form
                        onSubmit={renewForm.handleSubmit(onRenewSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <Label>Nouvelle date de début *</Label>
                            <DatePicker
                                value={renewForm.watch("startDate") || undefined}
                                onChange={(v) => renewForm.setValue("startDate", v ?? "")}
                            />
                            {renewForm.formState.errors.startDate && (
                                <p className="text-xs text-destructive">
                                    {renewForm.formState.errors.startDate.message}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurringRenew"
                                {...renewForm.register("isRecurring")}
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="isRecurringRenew" className="cursor-pointer">
                                Récurrent
                            </Label>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea rows={2} {...renewForm.register("notes")} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRenewDialog({open: false})}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={renewForm.formState.isSubmitting}>
                                {renewForm.formState.isSubmitting
                                    ? "Renouvellement…"
                                    : "Renouveler"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Supprimer l'abonnement"
                description="Le paiement associé sera également supprimé."
                onConfirm={async () => {
                    if (deleteTarget) {
                        await deleteSubscription.mutateAsync(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                loading={deleteSubscription.isPending}
            />
        </div>
    );
}

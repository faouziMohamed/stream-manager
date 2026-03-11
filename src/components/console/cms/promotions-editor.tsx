'use client';

import {useState} from 'react';
import {Controller, type Resolver, type SubmitHandler, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {CalendarClock, ChevronDown, ChevronRight, Eye, EyeOff, Package, Pencil, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {DateTimePicker} from '@/components/ui/date-time-picker';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
import {Switch} from '@/components/ui/switch';
import {formatCurrency} from '@/lib/utils/helpers';
import {
    useCreatePromotion,
    useDeletePromotion,
    usePromotions,
    useUpdatePromotion,
} from '@/lib/hooks/queries/use-promotions.queries';
import {
    useCreatePlan,
    useDeletePlan,
    usePlans,
    useServices,
    useUpdatePlan,
} from '@/lib/hooks/queries/use-services.queries';
import type {PromotionDto} from '@/lib/graphql/operations/promotions.operations';
import type {PlanDto} from '@/lib/graphql/operations/plans.operations';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const promotionSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    description: z.string().optional(),
    serviceMode: z.enum(['existing', 'new']),
    serviceIds: z.array(z.string()),
    newServiceName: z.string().optional(),
    newServiceCategory: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    showOnHomepage: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.serviceMode === 'existing' && data.serviceIds.length === 0) {
        ctx.addIssue({code: 'custom', path: ['serviceIds'], message: 'Sélectionnez au moins un service'});
    }
    if (data.serviceMode === 'new' && !data.newServiceName?.trim()) {
        ctx.addIssue({code: 'custom', path: ['newServiceName'], message: 'Nom du service requis'});
    }
});

const planSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    durationMonths: z.coerce.number().min(1, 'Durée minimale 1 mois'),
    price: z.coerce.number().min(0, 'Prix invalide'),
    currencyCode: z.string().min(1),
});

type PromotionForm = z.infer<typeof promotionSchema>;
type PlanForm = { name: string; durationMonths: number; price: number; currencyCode: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
}

function promoStatus(promo: PromotionDto) {
    const now = new Date();
    if (!promo.isActive) return {label: 'Inactive', variant: 'secondary' as const};
    if (promo.isExpired) return {label: 'Expirée', variant: 'destructive' as const};
    if (promo.expiresAt && new Date(promo.expiresAt) > now) return {label: 'Active', variant: 'default' as const};
    return {label: 'Active', variant: 'default' as const};
}

// ─── Plans sub-table ──────────────────────────────────────────────────────────

function PromotionPlansTable({promotionId, currency}: { promotionId: string; currency: string }) {
    const {data: plans = []} = usePlans(undefined);
    const promotionPlans = plans.filter((p) => p.promotionId === promotionId);
    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();
    const deletePlan = useDeletePlan();
    const [planDialog, setPlanDialog] = useState<{ open: boolean; plan?: PlanDto }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const {register, handleSubmit, reset, formState: {errors, isSubmitting}} =
        useForm<PlanForm>({
            resolver: zodResolver(planSchema) as Resolver<PlanForm>,
            defaultValues: {currencyCode: currency},
        });

    const openCreate = () => {
        reset({currencyCode: currency});
        setPlanDialog({open: true});
    };
    const openEdit = (plan: PlanDto) => {
        reset({
            name: plan.name,
            durationMonths: plan.durationMonths,
            price: plan.price,
            currencyCode: plan.currencyCode
        });
        setPlanDialog({open: true, plan});
    };

    const onSubmit = async (data: PlanForm) => {
        if (planDialog.plan) {
            await updatePlan.mutateAsync({id: planDialog.plan.id, input: {...data, planType: 'bundle'}});
        } else {
            await createPlan.mutateAsync({...data, planType: 'bundle', promotionId});
        }
        setPlanDialog({open: false});
    };

    return (
        <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formules
                    tarifaires</p>
                <Button size="sm" variant="outline" onClick={openCreate}>
                    <Plus className="h-3 w-3 mr-1"/>Ajouter
                </Button>
            </div>
            {promotionPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune formule — ajoutez-en une ci-dessus.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead className="w-20"/>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promotionPlans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>{plan.durationMonths} mois</TableCell>
                                <TableCell>{formatCurrency(plan.price, plan.currencyCode)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7"
                                                onClick={() => openEdit(plan)}>
                                            <Pencil className="h-3 w-3"/>
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                                onClick={() => setDeleteTarget(plan.id)}>
                                            <Trash2 className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog open={planDialog.open} onOpenChange={(o) => setPlanDialog({open: o})}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{planDialog.plan ? 'Modifier la formule' : 'Nouvelle formule'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Nom</Label>
                            <Input placeholder="ex: 1 mois" {...register('name')} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Durée (mois)</Label>
                                <Input type="number" min={1} {...register('durationMonths')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Prix</Label>
                                <Input type="number" step="0.01" min={0} {...register('price')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Devise</Label>
                                <Input placeholder="MAD" {...register('currencyCode')} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setPlanDialog({open: false})}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Supprimer la formule"
                description="Cette action est irréversible."
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

// ─── Main editor ──────────────────────────────────────────────────────────────

interface Props {
    initialData?: PromotionDto[];
    defaultCurrency?: string;
}

export function PromotionsEditor({initialData, defaultCurrency = 'MAD'}: Props) {
    const {data: promotions = []} = usePromotions(initialData);
    const {data: allServices = []} = useServices();
    const createPromotion = useCreatePromotion();
    const updatePromotion = useUpdatePromotion();
    const deletePromotion = useDeletePromotion();

    const [dialog, setDialog] = useState<{ open: boolean; promo?: PromotionDto }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const {register, handleSubmit, reset, watch, setValue, control, formState: {errors, isSubmitting}} =
        useForm<PromotionForm>({
            resolver: zodResolver(promotionSchema) as Resolver<PromotionForm>,
            defaultValues: {serviceMode: 'existing', serviceIds: [], showOnHomepage: true},
        });

    const serviceMode = watch('serviceMode');
    const selectedServiceIds = watch('serviceIds') ?? [];
    const startsAt = watch('startsAt');
    const expiresAt = watch('expiresAt');

    const toggleService = (id: string) => {
        setValue('serviceIds', selectedServiceIds.includes(id)
            ? selectedServiceIds.filter((s) => s !== id)
            : [...selectedServiceIds, id]);
    };

    const openCreate = () => {
        reset({serviceMode: 'existing', serviceIds: [], showOnHomepage: true});
        setDialog({open: true});
    };

    const openEdit = (p: PromotionDto) => {
        reset({
            name: p.name,
            description: p.description ?? '',
            serviceMode: 'existing',
            serviceIds: p.services?.map((s) => s.id) ?? [],
            startsAt: p.startsAt ?? undefined,
            expiresAt: p.expiresAt ?? undefined,
            showOnHomepage: p.showOnHomepage ?? true,
        });
        setDialog({open: true, promo: p});
    };

    const onSubmit: SubmitHandler<PromotionForm> = async (data) => {
        if (dialog.promo) {
            await updatePromotion.mutateAsync({
                id: dialog.promo.id,
                input: {
                    name: data.name,
                    description: data.description,
                    serviceIds: data.serviceIds,
                    startsAt: data.startsAt || undefined,
                    expiresAt: data.expiresAt || undefined,
                    showOnHomepage: data.showOnHomepage,
                },
            });
        } else {
            await createPromotion.mutateAsync({
                name: data.name,
                description: data.description,
                serviceIds: data.serviceMode === 'existing' ? data.serviceIds : [],
                newServiceName: data.serviceMode === 'new' ? data.newServiceName : undefined,
                newServiceCategory: data.serviceMode === 'new' ? data.newServiceCategory : undefined,
                startsAt: data.startsAt || undefined,
                expiresAt: data.expiresAt || undefined,
                showOnHomepage: data.showOnHomepage,
            });
        }
        setDialog({open: false});
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Promotions</h1>
                    <p className="text-muted-foreground text-sm">Offres groupées combinant plusieurs services</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2"/>Nouvelle promotion
                </Button>
            </div>

            {promotions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Aucune promotion. Créez-en une pour commencer.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {promotions.map((promo) => {
                        const status = promoStatus(promo);
                        const isExpanded = expandedId === promo.id;
                        return (
                            <Card key={promo.id} className={promo.isExpired || !promo.isActive ? 'opacity-60' : ''}>
                                <CardHeader className="py-3 px-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left flex-1 min-w-0"
                                            onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0"/>
                                                : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0"/>}
                                            <Package className="h-4 w-4 text-primary shrink-0"/>
                                            <span className="truncate">{promo.name}</span>
                                            <Badge variant={status.variant}
                                                   className="text-xs shrink-0">{status.label}</Badge>
                                            {promo.showOnHomepage === false && (
                                                <Badge variant="outline"
                                                       className="text-xs text-muted-foreground gap-1 shrink-0">
                                                    <EyeOff className="h-3 w-3"/>Masqué
                                                </Badge>
                                            )}
                                        </button>
                                        <div className="flex gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                                    onClick={() => openEdit(promo)}>
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                                    onClick={() => setDeleteTarget(promo.id)}>
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Meta info row */}
                                    <div className="ml-10 flex flex-wrap gap-3 items-center">
                                        {promo.description && (
                                            <p className="text-xs text-muted-foreground">{promo.description}</p>
                                        )}
                                        {promo.services && promo.services.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {promo.services.map((s) => (
                                                    <Badge key={s.id} variant="outline"
                                                           className="text-xs">{s.name}</Badge>
                                                ))}
                                            </div>
                                        )}
                                        {(promo.startsAt || promo.expiresAt) && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <CalendarClock className="h-3 w-3"/>
                                                {promo.startsAt && <span>Début: {formatDate(promo.startsAt)}</span>}
                                                {promo.startsAt && promo.expiresAt && <span>·</span>}
                                                {promo.expiresAt && (
                                                    <span className={promo.isExpired ? 'text-destructive' : ''}>
                                                        Expire: {formatDate(promo.expiresAt)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="pt-0 pb-4 px-4">
                                        <PromotionPlansTable promotionId={promo.id} currency={defaultCurrency}/>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit dialog */}
            <Dialog open={dialog.open} onOpenChange={(o) => setDialog({open: o})}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.promo ? 'Modifier la promotion' : 'Nouvelle promotion'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label>Nom *</Label>
                            <Input placeholder="ex: Netflix + Shahid VIP" {...register('name')} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea placeholder="Description…" rows={2} {...register('description')} />
                        </div>

                        {/* Services — only on create */}
                        {!dialog.promo && (
                            <div className="space-y-2">
                                <Label>Services inclus *</Label>
                                <div className="flex gap-2 text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setValue('serviceMode', 'existing')}
                                        className={`px-3 py-1.5 rounded border transition-colors ${serviceMode === 'existing' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                                    >
                                        Choisir existant
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('serviceMode', 'new')}
                                        className={`px-3 py-1.5 rounded border transition-colors ${serviceMode === 'new' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                                    >
                                        Créer un nouveau
                                    </button>
                                </div>

                                {serviceMode === 'existing' ? (
                                    <>
                                        {errors.serviceIds && (
                                            <p className="text-xs text-destructive">{errors.serviceIds.message}</p>
                                        )}
                                        {allServices.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">Aucun service
                                                disponible.</p>
                                        ) : (
                                            <div
                                                className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                                {allServices.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleService(s.id)}
                                                        className={`text-left text-sm px-2 py-1.5 rounded border transition-colors ${selectedServiceIds.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                                        <div className="space-y-1.5">
                                            <Label>Nom du service *</Label>
                                            <Input placeholder="ex: Disney+" {...register('newServiceName')} />
                                            {errors.newServiceName && (
                                                <p className="text-xs text-destructive">{errors.newServiceName.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Catégorie</Label>
                                            <Input placeholder="streaming"
                                                   defaultValue="streaming" {...register('newServiceCategory')} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Services on edit — pick from existing */}
                        {dialog.promo && (
                            <div className="space-y-1.5">
                                <Label>Services inclus</Label>
                                {errors.serviceIds && (
                                    <p className="text-xs text-destructive">{errors.serviceIds.message}</p>
                                )}
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                    {allServices.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleService(s.id)}
                                            className={`text-left text-sm px-2 py-1.5 rounded border transition-colors ${selectedServiceIds.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date range */}
                        <div className="space-y-3">
                            <Label>Période de validité</Label>
                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground">Date de début (optionnel)</p>
                                    <DateTimePicker
                                        value={startsAt}
                                        onChange={(v) => setValue('startsAt', v)}
                                        placeholder="Début de la promotion…"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground">Date d&apos;expiration (optionnel)</p>
                                    <DateTimePicker
                                        value={expiresAt}
                                        onChange={(v) => setValue('expiresAt', v)}
                                        placeholder="Expiration de la promotion…"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Une promotion expirée ne s&apos;affiche plus sur la page publique. Les abonnements
                                existants restent actifs.
                            </p>
                        </div>

                        {/* Visibility toggle */}
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground"/>
                                    Afficher sur la page d&apos;accueil
                                </Label>
                                <p className="text-xs text-muted-foreground">Cette promotion sera visible par les
                                    visiteurs</p>
                            </div>
                            <Controller
                                name="showOnHomepage"
                                control={control}
                                render={({field}) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Supprimer la promotion"
                description="Toutes les formules associées seront supprimées."
                onConfirm={async () => {
                    if (deleteTarget) {
                        await deletePromotion.mutateAsync(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                loading={deletePromotion.isPending}
            />
        </div>
    );
}

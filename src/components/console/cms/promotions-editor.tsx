'use client';

import {useState} from 'react';
import {type Resolver, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Package, Pencil, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
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
    useUpdatePlan
} from '@/lib/hooks/queries/use-services.queries';
import type {PromotionDto} from '@/lib/graphql/operations/promotions.operations';
import type {PlanDto} from '@/lib/graphql/operations/plans.operations';

const promotionSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    description: z.string().optional(),
    serviceIds: z.array(z.string()).min(1, 'Sélectionnez au moins un service'),
});

const planSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    durationMonths: z.coerce.number().min(1, 'Durée minimale 1 mois'),
    price: z.coerce.number().min(0, 'Prix invalide'),
    currencyCode: z.string().min(1),
});

type PromotionForm = z.infer<typeof promotionSchema>;
// Explicitly typed to avoid z.coerce inferred as unknown with zodResolver
type PlanForm = {
    name: string;
    durationMonths: number;
    price: number;
    currencyCode: string;
};

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
            defaultValues: {currencyCode: currency}
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formules</p>
                <Button size="sm" variant="outline" onClick={openCreate}><Plus
                    className="h-3 w-3 mr-1"/>Ajouter</Button>
            </div>
            {promotionPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune formule</p>
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
                                <TableCell>{plan.price} {plan.currencyCode}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7"
                                                onClick={() => openEdit(plan)}><Pencil className="h-3 w-3"/></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                                onClick={() => setDeleteTarget(plan.id)}><Trash2
                                            className="h-3 w-3"/></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            <Dialog open={planDialog.open} onOpenChange={(o) => setPlanDialog({open: o})}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{planDialog.plan ? 'Modifier la formule' : 'Nouvelle formule'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="space-y-1.5"><Label>Nom</Label><Input
                            placeholder="ex: 1 mois" {...register('name')} />{errors.name &&
                          <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Durée (mois)</Label><Input type="number"
                                                                                           min={1} {...register('durationMonths')} />
                            </div>
                            <div className="space-y-1.5"><Label>Prix</Label><Input type="number" step="0.01"
                                                                                   min={0} {...register('price')} />
                            </div>
                            <div className="space-y-1.5"><Label>Devise</Label><Input
                                placeholder="MAD" {...register('currencyCode')} /></div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setPlanDialog({open: false})}>Annuler</Button>
                            <Button type="submit"
                                    disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
                           title="Supprimer la formule" description="Cette action est irréversible."
                           onConfirm={async () => {
                               if (deleteTarget) {
                                   await deletePlan.mutateAsync(deleteTarget);
                                   setDeleteTarget(null);
                               }
                           }} loading={deletePlan.isPending}/>
        </div>
    );
}

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

    const {register, handleSubmit, reset, watch, setValue, formState: {errors, isSubmitting}} =
        useForm<PromotionForm>({resolver: zodResolver(promotionSchema), defaultValues: {serviceIds: []}});

    const selectedServiceIds = watch('serviceIds') ?? [];

    const toggleService = (id: string) => {
        const current = selectedServiceIds;
        setValue('serviceIds', current.includes(id) ? current.filter((s) => s !== id) : [...current, id]);
    };

    const openCreate = () => {
        reset({serviceIds: []});
        setDialog({open: true});
    };
    const openEdit = (p: PromotionDto) => {
        reset({name: p.name, description: p.description ?? '', serviceIds: p.services?.map((s) => s.id) ?? []});
        setDialog({open: true, promo: p});
    };

    const onSubmit = async (data: PromotionForm) => {
        if (dialog.promo) {
            await updatePromotion.mutateAsync({id: dialog.promo.id, input: data});
        } else {
            await createPromotion.mutateAsync(data);
        }
        setDialog({open: false});
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Promotions</h1>
                    <p className="text-muted-foreground text-sm">Offres groupées combinant plusieurs services</p>
                </div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2"/>Nouvelle promotion</Button>
            </div>

            {promotions.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune promotion. Créez-en une
                    pour commencer.</CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {promotions.map((promo) => (
                        <Card key={promo.id} className={promo.isActive ? '' : 'opacity-60'}>
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <button type="button"
                                            className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left"
                                            onClick={() => setExpandedId(expandedId === promo.id ? null : promo.id)}>
                                        <Package className="h-4 w-4 text-primary"/>
                                        {promo.name}
                                        {!promo.isActive && <Badge variant="secondary">Inactive</Badge>}
                                    </button>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8"
                                                onClick={() => openEdit(promo)}><Pencil
                                            className="h-3.5 w-3.5"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                                onClick={() => setDeleteTarget(promo.id)}><Trash2
                                            className="h-3.5 w-3.5"/></Button>
                                    </div>
                                </div>
                                {promo.description &&
                                  <p className="text-xs text-muted-foreground ml-6">{promo.description}</p>}
                                {promo.services && promo.services.length > 0 && (
                                    <div className="flex gap-1 ml-6 flex-wrap">
                                        {promo.services.map((s) => <Badge key={s.id} variant="outline"
                                                                          className="text-xs">{s.name}</Badge>)}
                                    </div>
                                )}
                            </CardHeader>
                            {expandedId === promo.id && (
                                <CardContent className="pt-0 pb-4 px-4">
                                    <PromotionPlansTable promotionId={promo.id} currency={defaultCurrency}/>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialog.open} onOpenChange={(o) => setDialog({open: o})}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{dialog.promo ? 'Modifier la promotion' : 'Nouvelle promotion'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nom *</Label>
                            <Input placeholder="ex: Netflix + Shahid VIP" {...register('name')}
                                   error={errors.name?.message}/>
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea placeholder="Description…" rows={2} {...register('description')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Services inclus *</Label>
                            {errors.serviceIds &&
                              <p className="text-xs text-destructive">{errors.serviceIds.message}</p>}
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {allServices.map((s) => (
                                    <button key={s.id} type="button"
                                            onClick={() => toggleService(s.id)}
                                            className={`text-left text-sm px-2 py-1.5 rounded border transition-colors ${selectedServiceIds.includes(s.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setDialog({open: false})}>Annuler</Button>
                            <Button type="submit"
                                    disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
                           title="Supprimer la promotion" description="Toutes les formules associées seront supprimées."
                           onConfirm={async () => {
                               if (deleteTarget) {
                                   await deletePromotion.mutateAsync(deleteTarget);
                                   setDeleteTarget(null);
                               }
                           }} loading={deletePromotion.isPending}/>
        </div>
    );
}

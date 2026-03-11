'use client';

import {useState} from 'react';
import {type Resolver, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ChevronDown, ChevronRight, Pencil, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
import {formatCurrency} from '@/lib/utils/helpers';
import {
    useCreatePlan,
    useCreateService,
    useDeletePlan,
    useDeleteService,
    usePlans,
    useServices,
    useUpdatePlan,
    useUpdateService,
} from '@/lib/hooks/queries/use-services.queries';
import type {ServiceDto} from '@/lib/graphql/operations/services.operations';
import type {PlanDto} from '@/lib/graphql/operations/plans.operations';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    category: z.string().min(1, 'Catégorie requise'),
    description: z.string().optional(),
    logoUrl: z.string().url('URL invalide').optional().or(z.literal('')),
});

const planSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    durationMonths: z.coerce.number().min(1, 'Durée minimale 1 mois'),
    price: z.coerce.number().min(0, 'Prix invalide'),
    currencyCode: z.string().min(1, 'Devise requise'),
    planType: z.enum(['full', 'partial', 'custom', 'bundle']),
    description: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;
// Explicitly typed to avoid z.coerce inferred as unknown with zodResolver
type PlanForm = {
    name: string;
    durationMonths: number;
    price: number;
    currencyCode: string;
    planType: 'full' | 'partial' | 'custom' | 'bundle';
    description?: string;
};

const planTypeLabels: Record<string, string> = {
    full: 'Complet',
    partial: 'Partiel',
    custom: 'Personnalisé',
    bundle: 'Offre groupée',
};

// ─── Plan sub-table ───────────────────────────────────────────────────────────

function PlansTable({serviceId, currency}: { serviceId: string; currency: string }) {
    const {data: plans = []} = usePlans(serviceId);
    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();
    const deletePlan = useDeletePlan();

    const [planDialog, setPlanDialog] = useState<{ open: boolean; plan?: PlanDto }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const {register, handleSubmit, reset, setValue, formState: {errors, isSubmitting}} =
        useForm<PlanForm>({
            resolver: zodResolver(planSchema) as Resolver<PlanForm>,
            defaultValues: {currencyCode: currency, planType: 'full'}
        });

    const openCreate = () => {
        reset({currencyCode: currency, planType: 'full'});
        setPlanDialog({open: true});
    };

    const openEdit = (plan: PlanDto) => {
        reset({
            name: plan.name,
            durationMonths: plan.durationMonths,
            price: plan.price,
            currencyCode: plan.currencyCode,
            planType: plan.planType as PlanForm['planType'],
            description: plan.description ?? '',
        });
        setPlanDialog({open: true, plan});
    };

    const onSubmit = async (data: PlanForm) => {
        if (planDialog.plan) {
            await updatePlan.mutateAsync({id: planDialog.plan.id, input: data});
        } else {
            await createPlan.mutateAsync({...data, serviceId});
        }
        setPlanDialog({open: false});
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formules</p>
                <Button size="sm" variant="outline" onClick={openCreate}>
                    <Plus className="h-3 w-3 mr-1"/> Ajouter
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
                            <TableHead className="w-20"/>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>{plan.durationMonths} mois</TableCell>
                                <TableCell>{formatCurrency(plan.price, plan.currencyCode)}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{planTypeLabels[plan.planType] ?? plan.planType}</Badge>
                                </TableCell>
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

            {/* Plan dialog */}
            <Dialog open={planDialog.open} onOpenChange={(o) => setPlanDialog({open: o})}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{planDialog.plan ? 'Modifier la formule' : 'Nouvelle formule'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nom</Label>
                                <Input placeholder="ex: 3 mois" {...register('name')} error={errors.name?.message}/>
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Durée (mois)</Label>
                                <Input type="number" min={1} {...register('durationMonths')}
                                       error={errors.durationMonths?.message}/>
                                {errors.durationMonths &&
                                  <p className="text-xs text-destructive">{errors.durationMonths.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Prix</Label>
                                <Input type="number" step="0.01" min={0} {...register('price')}
                                       error={errors.price?.message}/>
                                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Devise</Label>
                                <Input placeholder="MAD" {...register('currencyCode')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <Select defaultValue="full"
                                        onValueChange={(v) => setValue('planType', v as PlanForm['planType'])}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">Complet</SelectItem>
                                        <SelectItem value="partial">Partiel</SelectItem>
                                        <SelectItem value="custom">Personnalisé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Description (optionnel)</Label>
                                <Input placeholder="Détails supplémentaires…" {...register('description')} />
                            </div>
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

export function ServicesEditor({initialData, defaultCurrency = 'MAD'}: Props) {
    const {data: services = []} = useServices(initialData);
    const createService = useCreateService();
    const updateService = useUpdateService();
    const deleteService = useDeleteService();

    const [dialog, setDialog] = useState<{ open: boolean; service?: ServiceDto }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const {register, handleSubmit, reset, formState: {errors, isSubmitting}} =
        useForm<ServiceForm>({resolver: zodResolver(serviceSchema)});

    const openCreate = () => {
        reset({category: 'streaming'});
        setDialog({open: true});
    };
    const openEdit = (s: ServiceDto) => {
        reset({name: s.name, category: s.category, description: s.description ?? '', logoUrl: s.logoUrl ?? ''});
        setDialog({open: true, service: s});
    };

    const onSubmit = async (data: ServiceForm) => {
        const payload = {...data, description: data.description || undefined, logoUrl: data.logoUrl || undefined};
        if (dialog.service) {
            await updateService.mutateAsync({id: dialog.service.id, input: payload});
        } else {
            await createService.mutateAsync(payload);
        }
        setDialog({open: false});
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Services</h1>
                    <p className="text-muted-foreground text-sm">Gérez vos services et leurs formules tarifaires</p>
                </div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2"/>Nouveau service</Button>
            </div>

            {services.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun service. Créez-en un pour
                    commencer.</CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {services.map((service) => (
                        <Card key={service.id} className={service.isActive ? '' : 'opacity-60'}>
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left"
                                        onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                                    >
                                        {expandedId === service.id ? <ChevronDown className="h-4 w-4"/> :
                                            <ChevronRight className="h-4 w-4"/>}
                                        {service.name}
                                        <Badge variant="outline" className="text-xs">{service.category}</Badge>
                                        {!service.isActive && <Badge variant="secondary">Inactif</Badge>}
                                    </button>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8"
                                                onClick={() => openEdit(service)}><Pencil
                                            className="h-3.5 w-3.5"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                                onClick={() => setDeleteTarget(service.id)}><Trash2
                                            className="h-3.5 w-3.5"/></Button>
                                    </div>
                                </div>
                                {service.description &&
                                  <p className="text-xs text-muted-foreground ml-6">{service.description}</p>}
                            </CardHeader>
                            {expandedId === service.id && (
                                <CardContent className="pt-0 pb-4 px-4">
                                    <PlansTable serviceId={service.id} currency={defaultCurrency}/>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Service dialog */}
            <Dialog open={dialog.open} onOpenChange={(o) => setDialog({open: o})}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialog.service ? 'Modifier le service' : 'Nouveau service'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nom *</Label>
                            <Input placeholder="ex: Netflix" {...register('name')} error={errors.name?.message}/>
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Catégorie *</Label>
                            <Input placeholder="ex: streaming" {...register('category')}
                                   error={errors.category?.message}/>
                            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea placeholder="Description du service…" rows={2} {...register('description')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>URL du logo</Label>
                            <Input placeholder="https://…" {...register('logoUrl')} error={errors.logoUrl?.message}/>
                            {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
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

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title="Supprimer le service"
                description="Toutes les formules associées seront supprimées. Cette action est irréversible."
                onConfirm={async () => {
                    if (deleteTarget) {
                        await deleteService.mutateAsync(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                loading={deleteService.isPending}
            />
        </div>
    );
}

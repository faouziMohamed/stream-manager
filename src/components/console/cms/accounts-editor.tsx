'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Plus, Trash2, User, UserCheck, UserX,} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
import {cn} from '@/lib/utils/helpers';
import {
    useAssignProfile,
    useCreateAccount,
    useCreateProfile,
    useDeleteAccount,
    useDeleteProfile,
    useRemoveAssignment,
    useStreamingAccounts,
    useUpdateAccount,
    useUpdateProfile,
} from '@/lib/hooks/queries/use-accounts.queries';
import type {StreamingAccountDto, StreamingProfileDto} from '@/lib/graphql/operations/accounts.operations';
import type {ServiceDto} from '@/lib/graphql/operations/services.operations';
import type {SubscriptionDto} from '@/lib/graphql/operations/subscriptions.operations';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const accountSchema = z.object({
    serviceId: z.string().min(1, 'Service requis'),
    label: z.string().min(1, 'Libellé requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    password: z.string().optional(),
    maxProfiles: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(1).max(20)),
    notes: z.string().optional(),
});

const profileSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    profileIndex: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(1)),
});

const assignSchema = z.object({
    subscriptionId: z.string().min(1, 'Abonnement requis'),
    profileId: z.string().optional(),
});

type AccountFormInput = z.input<typeof accountSchema>;
type AccountForm = z.output<typeof accountSchema>;
type ProfileFormInput = z.input<typeof profileSchema>;
type ProfileForm = z.output<typeof profileSchema>;
type AssignForm = z.infer<typeof assignSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    initialData?: StreamingAccountDto[];
    services?: ServiceDto[];
    subscriptions?: SubscriptionDto[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    active: 'bg-primary/10 text-primary border-primary/20',
    expired: 'bg-muted text-muted-foreground',
    paused: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    cancelled: 'bg-destructive/10 text-destructive',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountsEditor({initialData, services = [], subscriptions = []}: Props) {
    const {data: accounts = []} = useStreamingAccounts(undefined, initialData);
    const createAccount = useCreateAccount();
    const updateAccount = useUpdateAccount();
    const deleteAccount = useDeleteAccount();
    const createProfile = useCreateProfile();
    const updateProfile = useUpdateProfile();
    const deleteProfile = useDeleteProfile();
    const assignProfile = useAssignProfile();
    const removeAssignment = useRemoveAssignment();

    // UI state
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [accountDialog, setAccountDialog] = useState<{ open: boolean; acc?: StreamingAccountDto }>({open: false});
    const [profileDialog, setProfileDialog] = useState<{
        open: boolean;
        accountId?: string;
        profile?: StreamingProfileDto
    }>({open: false});
    const [assignDialog, setAssignDialog] = useState<{
        open: boolean;
        accountId?: string;
        profile?: StreamingProfileDto
    }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'account' | 'profile'; id: string } | null>(null);

    // Forms
    const accountForm = useForm<AccountFormInput>({resolver: zodResolver(accountSchema)});
    const profileForm = useForm<ProfileFormInput>({resolver: zodResolver(profileSchema)});
    const assignForm = useForm<AssignForm>({resolver: zodResolver(assignSchema)});

    // ── Account handlers ──────────────────────────────────────────────────────

    const openCreateAccount = () => {
        accountForm.reset({maxProfiles: 1});
        setAccountDialog({open: true});
    };

    const openEditAccount = (acc: StreamingAccountDto) => {
        accountForm.reset({
            serviceId: acc.serviceId,
            label: acc.label,
            email: acc.email ?? '',
            password: '',
            maxProfiles: acc.maxProfiles,
            notes: acc.notes ?? '',
        });
        setAccountDialog({open: true, acc});
    };

    const onAccountSubmit = async (raw: AccountFormInput) => {
        const data = raw as AccountForm;
        if (accountDialog.acc) {
            await updateAccount.mutateAsync({
                id: accountDialog.acc.id,
                input: {
                    label: data.label,
                    email: data.email || undefined,
                    password: data.password || undefined,
                    maxProfiles: data.maxProfiles,
                    notes: data.notes || undefined,
                },
            });
        } else {
            await createAccount.mutateAsync({
                serviceId: data.serviceId,
                label: data.label,
                email: data.email || undefined,
                password: data.password || undefined,
                maxProfiles: data.maxProfiles,
                notes: data.notes || undefined,
            });
        }
        setAccountDialog({open: false});
    };

    // ── Profile handlers ──────────────────────────────────────────────────────

    const openAddProfile = (accountId: string) => {
        profileForm.reset({name: '', profileIndex: 1});
        setProfileDialog({open: true, accountId});
    };

    const openEditProfile = (accountId: string, profile: StreamingProfileDto) => {
        profileForm.reset({name: profile.name, profileIndex: profile.profileIndex});
        setProfileDialog({open: true, accountId, profile});
    };

    const onProfileSubmit = async (raw: ProfileFormInput) => {
        const data = raw as ProfileForm;
        if (profileDialog.profile) {
            await updateProfile.mutateAsync({id: profileDialog.profile.id, input: data});
        } else if (profileDialog.accountId) {
            await createProfile.mutateAsync({accountId: profileDialog.accountId, ...data});
        }
        setProfileDialog({open: false});
    };

    // ── Assign handlers ───────────────────────────────────────────────────────

    const openAssign = (accountId: string, profile: StreamingProfileDto) => {
        const current = profile.assignment;
        assignForm.reset({subscriptionId: current?.subscriptionId ?? '', profileId: profile.id});
        setAssignDialog({open: true, accountId, profile});
    };

    const onAssignSubmit = async (data: AssignForm) => {
        if (!assignDialog.accountId) return;
        await assignProfile.mutateAsync({
            subscriptionId: data.subscriptionId,
            accountId: assignDialog.accountId,
            profileId: assignDialog.profile?.id ?? null,
        });
        setAssignDialog({open: false});
    };

    const handleRemoveAssignment = async (subscriptionId: string) => {
        await removeAssignment.mutateAsync(subscriptionId);
    };

    // ── Delete handler ────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'account') await deleteAccount.mutateAsync(deleteTarget.id);
        else await deleteProfile.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const totalSlots = accounts.reduce((s, a) => s + a.maxProfiles, 0);
    const usedSlots = accounts.reduce((s, a) => s + a.usedProfiles, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Comptes streaming</h1>
                    <p className="text-muted-foreground text-sm">
                        {accounts.length} compte{accounts.length !== 1 ? 's' : ''} —{' '}
                        {usedSlots}/{totalSlots} profils utilisés
                    </p>
                </div>
                <Button onClick={openCreateAccount}>
                    <Plus className="h-4 w-4 mr-2"/>
                    Nouveau compte
                </Button>
            </div>

            {/* Accounts list */}
            {accounts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Aucun compte streaming. Ajoutez votre premier compte.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {accounts.map((acc) => {
                        const isExpanded = expandedAccount === acc.id;
                        const usedCount = acc.usedProfiles;
                        const isFull = usedCount >= acc.maxProfiles;

                        return (
                            <Card key={acc.id} className={cn(!acc.isActive && 'opacity-60')}>
                                <CardHeader className="py-3 px-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Expand toggle */}
                                        <button
                                            onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}
                                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground"/>
                                                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground"/>
                                            }
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <CardTitle className="text-base">{acc.label}</CardTitle>
                                                    {acc.service && (
                                                        <Badge variant="outline"
                                                               className="text-xs">{acc.service.name}</Badge>
                                                    )}
                                                    {!acc.isActive &&
                                                      <Badge variant="secondary" className="text-xs">Inactif</Badge>}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {acc.email ?? 'Pas d\'email'} · {usedCount}/{acc.maxProfiles} profils
                                                    {isFull && <span className="text-destructive ml-1">· Complet</span>}
                                                </p>
                                            </div>
                                        </button>

                                        {/* Capacity bar */}
                                        <div className="hidden sm:flex items-center gap-1.5">
                                            {Array.from({length: acc.maxProfiles}, (_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                                                        i < usedCount
                                                            ? 'bg-primary border-primary'
                                                            : 'border-muted-foreground/30',
                                                    )}
                                                >
                                                    {i < usedCount &&
                                                      <User className="h-2.5 w-2.5 text-primary-foreground"/>}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                                    onClick={() => openEditAccount(acc)}>
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                                    onClick={() => setDeleteTarget({type: 'account', id: acc.id})}>
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Expanded: credentials + profiles */}
                                {isExpanded && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        {/* Credentials */}
                                        <div
                                            className="flex items-center gap-2 text-sm bg-muted/30 rounded-md px-3 py-2 flex-wrap">
                                            <span className="text-muted-foreground">Email :</span>
                                            <span className="font-mono">{acc.email ?? '—'}</span>
                                            <span className="text-muted-foreground ml-2">Mot de passe :</span>
                                            {showPassword[acc.id]
                                                ? <span className="font-mono">••••••••</span>
                                                : <span className="font-mono">••••••••</span>
                                            }
                                            <button
                                                onClick={() => setShowPassword((p) => ({...p, [acc.id]: !p[acc.id]}))}
                                                className="ml-1 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword[acc.id] ? <EyeOff className="h-3.5 w-3.5"/> :
                                                    <Eye className="h-3.5 w-3.5"/>}
                                            </button>
                                        </div>

                                        {/* Profiles */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profils</p>
                                                {acc.profiles.length < acc.maxProfiles && (
                                                    <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                                                            onClick={() => openAddProfile(acc.id)}>
                                                        <Plus className="h-3 w-3 mr-1"/> Ajouter
                                                    </Button>
                                                )}
                                            </div>
                                            {acc.profiles.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">Aucun profil
                                                    défini.</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {acc.profiles.map((profile) => {
                                                        const assignment = profile.assignment;
                                                        const sub = assignment?.subscription;
                                                        return (
                                                            <div
                                                                key={profile.id}
                                                                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm flex-wrap"
                                                            >
                                                                <div
                                                                    className="flex items-center gap-1.5 min-w-0 flex-1">
                                                                    {assignment
                                                                        ? <UserCheck
                                                                            className="h-3.5 w-3.5 text-primary shrink-0"/>
                                                                        : <UserX
                                                                            className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                                                                    }
                                                                    <span className="font-medium">{profile.name}</span>
                                                                    <span
                                                                        className="text-muted-foreground text-xs">#{profile.profileIndex}</span>
                                                                </div>

                                                                {/* Assignment info */}
                                                                {sub ? (
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn('text-xs', statusColors[sub.status])}
                                                                        >
                                                                            {sub.client?.name ?? '—'}
                                                                        </Badge>
                                                                        <span
                                                                            className="text-xs text-muted-foreground">jusqu&apos;au {sub.endDate}</span>
                                                                        <Button size="sm" variant="ghost"
                                                                                className="h-6 text-xs px-1.5 text-destructive"
                                                                                onClick={() => handleRemoveAssignment(assignment!.subscriptionId)}>
                                                                            Libérer
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button size="sm" variant="outline"
                                                                            className="h-6 text-xs px-2"
                                                                            onClick={() => openAssign(acc.id, profile)}>
                                                                        Assigner
                                                                    </Button>
                                                                )}

                                                                {/* Profile actions */}
                                                                <div className="flex gap-1 shrink-0">
                                                                    <Button size="icon" variant="ghost"
                                                                            className="h-6 w-6"
                                                                            onClick={() => openEditProfile(acc.id, profile)}>
                                                                        <Pencil className="h-3 w-3"/>
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost"
                                                                            className="h-6 w-6 text-destructive"
                                                                            onClick={() => setDeleteTarget({
                                                                                type: 'profile',
                                                                                id: profile.id
                                                                            })}>
                                                                        <Trash2 className="h-3 w-3"/>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {acc.notes && (
                                            <p className="text-xs text-muted-foreground italic">{acc.notes}</p>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Account dialog ───────────────────────────────────────────────── */}
            <Dialog open={accountDialog.open} onOpenChange={(o) => setAccountDialog({open: o})}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {accountDialog.acc ? 'Modifier le compte' : 'Nouveau compte streaming'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                        {!accountDialog.acc && (
                            <div className="space-y-1.5">
                                <Label>Service *</Label>
                                <Select onValueChange={(v) => accountForm.setValue('serviceId', v)}>
                                    <SelectTrigger error={accountForm.formState.errors.serviceId?.message}>
                                        <SelectValue placeholder="Choisir un service"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Libellé *</Label>
                            <Input
                                placeholder="ex: Netflix compte principal"
                                {...accountForm.register('label')}
                                error={accountForm.formState.errors.label?.message}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email du compte</Label>
                            <Input
                                type="email"
                                placeholder="email@exemple.com"
                                {...accountForm.register('email')}
                                error={accountForm.formState.errors.email?.message}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{accountDialog.acc ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                {...accountForm.register('password')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Nombre de profils max *</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                {...accountForm.register('maxProfiles')}
                                error={accountForm.formState.errors.maxProfiles?.message}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea rows={2} placeholder="Notes internes…" {...accountForm.register('notes')} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAccountDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                                {accountForm.formState.isSubmitting ? 'Enregistrement…' : accountDialog.acc ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Profile dialog ───────────────────────────────────────────────── */}
            <Dialog open={profileDialog.open} onOpenChange={(o) => setProfileDialog({open: o})}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {profileDialog.profile ? 'Modifier le profil' : 'Nouveau profil'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nom du profil *</Label>
                            <Input
                                placeholder="ex: Profil 1"
                                {...profileForm.register('name')}
                                error={profileForm.formState.errors.name?.message}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Numéro de position</Label>
                            <Input
                                type="number"
                                min={1}
                                {...profileForm.register('profileIndex')}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setProfileDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                {profileForm.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Assign dialog ─────────────────────────────────────────────────── */}
            <Dialog open={assignDialog.open} onOpenChange={(o) => setAssignDialog({open: o})}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            Assigner &ldquo;{assignDialog.profile?.name}&rdquo; à un abonné
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Abonnement *</Label>
                            <Select onValueChange={(v) => assignForm.setValue('subscriptionId', v)}
                                    defaultValue={assignForm.getValues('subscriptionId')}>
                                <SelectTrigger error={assignForm.formState.errors.subscriptionId?.message}>
                                    <SelectValue placeholder="Choisir un abonnement actif"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptions
                                        .filter((s) => s.status === 'active')
                                        .map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.client?.name ?? s.clientId} — jusqu&apos;au {s.endDate}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAssignDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={assignForm.formState.isSubmitting}>
                                Assigner
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Confirm delete ───────────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title={deleteTarget?.type === 'account' ? 'Supprimer le compte' : 'Supprimer le profil'}
                description={
                    deleteTarget?.type === 'account'
                        ? 'Tous les profils associés seront également supprimés.'
                        : 'L\'assignation associée sera également supprimée.'
                }
                onConfirm={handleDelete}
                loading={deleteAccount.isPending || deleteProfile.isPending}
            />
        </div>
    );
}

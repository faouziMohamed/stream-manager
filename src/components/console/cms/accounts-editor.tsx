'use client';

import {useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Layers,
    LayersIcon,
    Pencil,
    Plus,
    Trash2,
    User,
    UserCheck,
    UserX,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
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
import type {StreamingAccountDto, StreamingProfileDto,} from '@/lib/graphql/operations/accounts.operations';
import type {ServiceDto} from '@/lib/graphql/operations/services.operations';
import type {SubscriptionDto} from '@/lib/graphql/operations/subscriptions.operations';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const accountSchema = z.object({
    serviceId: z.string().min(1, 'Service requis'),
    label: z.string().min(1, 'Libellé requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    supportsProfiles: z.boolean().default(true),
    maxProfiles: z.union([z.number(), z.string().transform(Number)])
        .pipe(z.number().int().min(1).max(20)),
    notes: z.string().optional(),
}).refine(
    (d) => !!(d.email || d.phone),
    {message: 'Au moins un email ou un numéro de téléphone est requis', path: ['email']},
);

const profileSchema = z.object({
    name: z.string().min(1, 'Nom requis'),
    profileIndex: z.union([z.number(), z.string().transform(Number)])
        .pipe(z.number().int().min(1)),
    pin: z.string().optional().or(z.literal('')),
});

const assignSchema = z.object({
    subscriptionId: z.string().min(1, 'Abonnement requis'),
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

const statusLabels: Record<string, string> = {
    active: 'Actif',
    expired: 'Expiré',
    paused: 'En pause',
    cancelled: 'Annulé',
};

// ─── Account form inner (needs useWatch, must be a component) ─────────────────

function AccountFormFields({form, isEdit, services}: {
    form: ReturnType<typeof useForm<AccountFormInput>>;
    isEdit: boolean;
    services: ServiceDto[];
}) {
    const supportsProfiles = useWatch({control: form.control, name: 'supportsProfiles'});

    return (
        <div className="space-y-4">
            {!isEdit && (
                <div className="space-y-1.5">
                    <Label>Service *</Label>
                    <Select onValueChange={(v) => form.setValue('serviceId', v)}>
                        <SelectTrigger error={form.formState.errors.serviceId?.message}>
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
                <Input placeholder="ex: Netflix compte principal"
                       {...form.register('label')}
                       error={form.formState.errors.label?.message}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Email du compte</Label>
                    <Input type="email" placeholder="email@exemple.com"
                           {...form.register('email')}
                           error={form.formState.errors.email?.message}/>
                </div>
                <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input type="tel" placeholder="+212 6XX XXX XXX"
                           {...form.register('phone')}
                           error={form.formState.errors.phone?.message}/>
                </div>
            </div>

            {/* at-least-one error appears on the email path via refine */}
            {form.formState.errors.email?.message?.includes('requis') && (
                <p className="text-xs text-destructive -mt-2">
                    {form.formState.errors.email.message}
                </p>
            )}

            {/* supportsProfiles toggle */}
            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Gestion par profils</Label>
                    <p className="text-xs text-muted-foreground">
                        La plateforme supporte plusieurs profils (ex: Netflix, Disney+)
                    </p>
                </div>
                <Switch
                    checked={!!supportsProfiles}
                    onCheckedChange={(v) => {
                        form.setValue('supportsProfiles', v);
                        if (!v) form.setValue('maxProfiles', 1);
                    }}
                />
            </div>

            {/* maxProfiles — only relevant when supportsProfiles */}
            {supportsProfiles && (
                <div className="space-y-1.5">
                    <Label>Nombre de profils max *</Label>
                    <Input type="number" min={1} max={20}
                           {...form.register('maxProfiles')}
                           error={form.formState.errors.maxProfiles?.message}/>
                </div>
            )}

            <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Notes internes…" {...form.register('notes')}/>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
    const [showPin, setShowPin] = useState<Record<string, boolean>>({});
    const [accountDialog, setAccountDialog] = useState<{
        open: boolean; acc?: StreamingAccountDto;
    }>({open: false});
    const [profileDialog, setProfileDialog] = useState<{
        open: boolean; accountId?: string; profile?: StreamingProfileDto;
    }>({open: false});
    // assign dialog: used for both profile-level and account-level assignments
    const [assignDialog, setAssignDialog] = useState<{
        open: boolean;
        accountId?: string;
        profile?: StreamingProfileDto | null; // null = account-level (no profile)
        title?: string;
    }>({open: false});
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'account' | 'profile'; id: string;
    } | null>(null);

    // Forms
    const accountForm = useForm<AccountFormInput>({resolver: zodResolver(accountSchema)});
    const profileForm = useForm<ProfileFormInput>({resolver: zodResolver(profileSchema)});
    const assignForm = useForm<AssignForm>({resolver: zodResolver(assignSchema)});

    // ── Account handlers ──────────────────────────────────────────────────────

    const openCreateAccount = () => {
        accountForm.reset({maxProfiles: 1, email: '', phone: '', supportsProfiles: true});
        setAccountDialog({open: true});
    };

    const openEditAccount = (acc: StreamingAccountDto) => {
        accountForm.reset({
            serviceId: acc.serviceId,
            label: acc.label,
            email: acc.email ?? '',
            phone: acc.phone ?? '',
            supportsProfiles: acc.supportsProfiles,
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
                    phone: data.phone || undefined,
                    supportsProfiles: data.supportsProfiles,
                    maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
                    notes: data.notes || undefined,
                },
            });
        } else {
            await createAccount.mutateAsync({
                serviceId: data.serviceId,
                label: data.label,
                email: data.email || undefined,
                phone: data.phone || undefined,
                supportsProfiles: data.supportsProfiles,
                maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
                notes: data.notes || undefined,
            });
        }
        setAccountDialog({open: false});
    };

    // ── Profile handlers ──────────────────────────────────────────────────────

    const openAddProfile = (accountId: string) => {
        profileForm.reset({name: '', profileIndex: 1, pin: ''});
        setProfileDialog({open: true, accountId});
    };

    const openEditProfile = (accountId: string, profile: StreamingProfileDto) => {
        profileForm.reset({
            name: profile.name,
            profileIndex: profile.profileIndex,
            pin: profile.pin ?? '',
        });
        setProfileDialog({open: true, accountId, profile});
    };

    const onProfileSubmit = async (raw: ProfileFormInput) => {
        const data = raw as ProfileForm;
        if (profileDialog.profile) {
            await updateProfile.mutateAsync({
                id: profileDialog.profile.id,
                input: {name: data.name, profileIndex: data.profileIndex, pin: data.pin || null},
            });
        } else if (profileDialog.accountId) {
            await createProfile.mutateAsync({
                accountId: profileDialog.accountId,
                name: data.name,
                profileIndex: data.profileIndex,
                pin: data.pin || undefined,
            });
        }
        setProfileDialog({open: false});
    };

    // ── Assign handlers ───────────────────────────────────────────────────────
    // Supports two modes:
    //   • profile-level: profile != null — links subscription → specific profile
    //   • account-level: profile == null — links subscription → account (no profile)

    const openAssignProfile = (accountId: string, profile: StreamingProfileDto) => {
        assignForm.reset({subscriptionId: profile.assignment?.subscriptionId ?? ''});
        setAssignDialog({
            open: true,
            accountId,
            profile,
            title: `Assigner le profil « ${profile.name} »`,
        });
    };

    const openAssignAccount = (acc: StreamingAccountDto) => {
        assignForm.reset({subscriptionId: acc.accountAssignment?.subscriptionId ?? ''});
        setAssignDialog({
            open: true,
            accountId: acc.id,
            profile: null,
            title: `Assigner le compte « ${acc.label} »`,
        });
    };

    const onAssignSubmit = async (data: AssignForm) => {
        if (!assignDialog.accountId) return;
        await assignProfile.mutateAsync({
            subscriptionId: data.subscriptionId,
            accountId: assignDialog.accountId,
            // profile === null → account-level assign (profileId stays null in DB)
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

    // ── Stats ─────────────────────────────────────────────────────────────────

    const profileAccounts = accounts.filter((a) => a.supportsProfiles);
    const totalSlots = profileAccounts.reduce((s, a) => s + a.maxProfiles, 0);
    const usedSlots = profileAccounts.reduce((s, a) => s + a.usedProfiles, 0);
    const noProfileUsed = accounts
        .filter((a) => !a.supportsProfiles)
        .reduce((s, a) => s + a.usedProfiles, 0);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Comptes streaming</h1>
                    <p className="text-muted-foreground text-sm">
                        {accounts.length} compte{accounts.length !== 1 ? 's' : ''}
                        {totalSlots > 0 && ` · ${usedSlots}/${totalSlots} profils utilisés`}
                        {noProfileUsed > 0 && ` · ${noProfileUsed} compte${noProfileUsed !== 1 ? 's' : ''} sans profils assigné${noProfileUsed !== 1 ? 's' : ''}`}
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
                        const isFull = acc.supportsProfiles && usedCount >= acc.maxProfiles;
                        const identity = [acc.email, acc.phone].filter(Boolean).join(' · ') || '—';

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
                                                        <Badge variant="outline" className="text-xs">
                                                            {acc.service.name}
                                                        </Badge>
                                                    )}
                                                    {/* supportsProfiles badge */}
                                                    {acc.supportsProfiles
                                                        ? (
                                                            <Badge variant="outline"
                                                                   className="text-xs gap-1 border-primary/30 text-primary">
                                                                <Layers className="h-2.5 w-2.5"/>
                                                                {usedCount}/{acc.maxProfiles} profils
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline"
                                                                   className="text-xs text-muted-foreground gap-1">
                                                                <LayersIcon className="h-2.5 w-2.5"/>
                                                                Sans profils
                                                            </Badge>
                                                        )
                                                    }
                                                    {isFull && (
                                                        <Badge variant="destructive" className="text-xs">Complet</Badge>
                                                    )}
                                                    {!acc.isActive && (
                                                        <Badge variant="secondary" className="text-xs">Inactif</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {identity}
                                                </p>
                                            </div>
                                        </button>

                                        {/* Capacity dots — only for profile-supporting accounts */}
                                        {acc.supportsProfiles && (
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
                                                        {i < usedCount && (
                                                            <User className="h-2.5 w-2.5 text-primary-foreground"/>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                                    onClick={() => openEditAccount(acc)}>
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button size="icon" variant="ghost"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => setDeleteTarget({type: 'account', id: acc.id})}>
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        {/* Identity */}
                                        <div
                                            className="flex flex-wrap gap-x-4 gap-y-1 text-sm bg-muted/30 rounded-md px-3 py-2">
                                            {acc.email && (
                                                <span className="text-muted-foreground">
                                                    Email :{' '}
                                                    <span className="font-mono text-foreground">{acc.email}</span>
                                                </span>
                                            )}
                                            {acc.phone && (
                                                <span className="text-muted-foreground">
                                                    Tél :{' '}
                                                    <span className="font-mono text-foreground">{acc.phone}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* ── Platform WITH profiles ─────────────────── */}
                                        {acc.supportsProfiles ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        Profils
                                                    </p>
                                                    {acc.profiles.length < acc.maxProfiles && (
                                                        <Button size="sm" variant="outline"
                                                                className="h-6 text-xs px-2"
                                                                onClick={() => openAddProfile(acc.id)}>
                                                            <Plus className="h-3 w-3 mr-1"/>Ajouter
                                                        </Button>
                                                    )}
                                                </div>

                                                {acc.profiles.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        Aucun profil défini.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {acc.profiles.map((profile) => {
                                                            const assignment = profile.assignment;
                                                            const sub = assignment?.subscription;
                                                            const pinKey = `${acc.id}:${profile.id}`;
                                                            return (
                                                                <div key={profile.id}
                                                                     className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm flex-wrap">
                                                                    {/* Profile identity */}
                                                                    <div
                                                                        className="flex items-center gap-1.5 min-w-0 flex-1">
                                                                        {assignment
                                                                            ? <UserCheck
                                                                                className="h-3.5 w-3.5 text-primary shrink-0"/>
                                                                            : <UserX
                                                                                className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                                                                        }
                                                                        <span
                                                                            className="font-medium">{profile.name}</span>
                                                                        <span className="text-muted-foreground text-xs">
                                                                            #{profile.profileIndex}
                                                                        </span>
                                                                        {profile.pin && (
                                                                            <span
                                                                                className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                                                                                PIN :
                                                                                <span className="font-mono">
                                                                                    {showPin[pinKey] ? profile.pin : '••••'}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => setShowPin((p) => ({
                                                                                        ...p,
                                                                                        [pinKey]: !p[pinKey],
                                                                                    }))}
                                                                                    className="hover:text-foreground transition-colors"
                                                                                >
                                                                                    {showPin[pinKey]
                                                                                        ? <EyeOff className="h-3 w-3"/>
                                                                                        : <Eye className="h-3 w-3"/>
                                                                                    }
                                                                                </button>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Assignment */}
                                                                    {sub ? (
                                                                        <div
                                                                            className="flex items-center gap-2 flex-wrap">
                                                                            <Badge variant="outline"
                                                                                   className={cn('text-xs', statusColors[sub.status])}>
                                                                                {sub.client?.name ?? '—'}
                                                                            </Badge>
                                                                            <span
                                                                                className="text-xs text-muted-foreground">
                                                                                jusqu&apos;au {sub.endDate}
                                                                            </span>
                                                                            <Button size="sm" variant="ghost"
                                                                                    className="h-6 text-xs px-1.5 text-destructive"
                                                                                    onClick={() => handleRemoveAssignment(assignment!.subscriptionId)}>
                                                                                Libérer
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Button size="sm" variant="outline"
                                                                                className="h-6 text-xs px-2"
                                                                                onClick={() => openAssignProfile(acc.id, profile)}>
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
                                                                                    id: profile.id,
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
                                        ) : (
                                            /* ── Platform WITHOUT profiles ───────────── */
                                            <div className="rounded-md border px-3 py-2.5">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                            Utilisateur assigné
                                                        </span>
                                                    </div>
                                                    {/* Account-level assignment — profileId IS NULL in DB */}
                                                    {(() => {
                                                        const acctAssignment = acc.accountAssignment;
                                                        const sub = acctAssignment?.subscription;
                                                        if (sub) {
                                                            return (
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <Badge variant="outline"
                                                                           className={cn('text-xs', statusColors[sub.status])}>
                                                                        <UserCheck className="h-3 w-3 mr-1"/>
                                                                        {sub.client?.name ?? '—'}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {statusLabels[sub.status]} · jusqu&apos;au {sub.endDate}
                                                                    </span>
                                                                    <Button size="sm" variant="ghost"
                                                                            className="h-6 text-xs px-1.5 text-destructive"
                                                                            onClick={() => handleRemoveAssignment(acctAssignment!.subscriptionId)}>
                                                                        Libérer
                                                                    </Button>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    <UserX
                                                                        className="h-3.5 w-3.5 inline mr-1 text-muted-foreground"/>
                                                                    Non assigné
                                                                </span>
                                                                <Button size="sm" variant="outline"
                                                                        className="h-6 text-xs px-2"
                                                                        onClick={() => openAssignAccount(acc)}>
                                                                    Assigner un abonné
                                                                </Button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

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

            {/* ── Account dialog ─────────────────────────────────────────────── */}
            <Dialog open={accountDialog.open} onOpenChange={(o) => setAccountDialog({open: o})}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {accountDialog.acc ? 'Modifier le compte' : 'Nouveau compte streaming'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
                        <AccountFormFields
                            form={accountForm}
                            isEdit={!!accountDialog.acc}
                            services={services}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline"
                                    onClick={() => setAccountDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={accountForm.formState.isSubmitting}>
                                {accountForm.formState.isSubmitting
                                    ? 'Enregistrement…'
                                    : accountDialog.acc ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Profile dialog ──────────────────────────────────────────────── */}
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
                            <Input placeholder="ex: Profil 1"
                                   {...profileForm.register('name')}
                                   error={profileForm.formState.errors.name?.message}/>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Position dans le compte</Label>
                            <Input type="number" min={1}
                                   {...profileForm.register('profileIndex')}
                                   error={profileForm.formState.errors.profileIndex?.message}/>
                            <p className="text-xs text-muted-foreground">
                                Numéro d&apos;ordre du profil sur la plateforme (1, 2, 3…)
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Code PIN{' '}
                                <span className="text-muted-foreground font-normal text-xs">(chiffré en base)</span>
                            </Label>
                            <Input type="password" placeholder="ex: 1234"
                                   autoComplete="new-password"
                                   {...profileForm.register('pin')}/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setProfileDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                                {profileForm.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Assign dialog (profile-level OR account-level) ──────────────── */}
            <Dialog open={assignDialog.open} onOpenChange={(o) => setAssignDialog({open: o})}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{assignDialog.title ?? 'Assigner à un abonné'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Abonnement actif *</Label>
                            <Select
                                onValueChange={(v) => assignForm.setValue('subscriptionId', v)}
                                defaultValue={assignForm.getValues('subscriptionId')}
                            >
                                <SelectTrigger error={assignForm.formState.errors.subscriptionId?.message}>
                                    <SelectValue placeholder="Choisir un abonnement"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptions.filter((s) => s.status === 'active').map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.client?.name ?? s.clientId}
                                            {' — '}jusqu&apos;au {s.endDate}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {subscriptions.filter((s) => s.status === 'active').length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Aucun abonnement actif trouvé.
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setAssignDialog({open: false})}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={assignForm.formState.isSubmitting}>
                                Assigner
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Confirm delete ──────────────────────────────────────────────── */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                title={deleteTarget?.type === 'account' ? 'Supprimer le compte' : 'Supprimer le profil'}
                description={
                    deleteTarget?.type === 'account'
                        ? 'Tous les profils et assignations associés seront supprimés.'
                        : "L'assignation associée sera également supprimée."
                }
                onConfirm={handleDelete}
                loading={deleteAccount.isPending || deleteProfile.isPending}
            />
        </div>
    );
}

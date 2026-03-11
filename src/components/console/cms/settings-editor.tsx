'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useState} from 'react';
import {Check, Copy, Plus, ToggleLeft, ToggleRight, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {ConfirmDialog} from '@/components/console/confirm-dialog';
import {DatePicker} from '@/components/ui/date-picker';
import {
    useCreateSummaryLink,
    useDefaultCurrency,
    useDeleteSummaryLink,
    useSetDefaultCurrency,
    useSummaryLinks,
    useToggleSummaryLink,
} from '@/lib/hooks/queries/use-settings.queries';

const currencySchema = z.object({currency: z.string().min(1, 'Devise requise').max(10)});
type CurrencyForm = z.infer<typeof currencySchema>;

const linkSchema = z.object({
    label: z.string().optional(),
    showSensitiveInfo: z.boolean(),
    expiresAt: z.string().optional(),
});
type LinkForm = z.infer<typeof linkSchema>;

interface Props {
    defaultCurrency?: string;
}

export function SettingsEditor({defaultCurrency = 'MAD'}: Props) {
    const {data: currency} = useDefaultCurrency(defaultCurrency);
    const setCurrency = useSetDefaultCurrency();
    const {data: summaryLinks = []} = useSummaryLinks();
    const createLink = useCreateSummaryLink();
    const deleteLink = useDeleteSummaryLink();
    const toggleLink = useToggleSummaryLink();

    const [linkDialog, setLinkDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const currencyForm = useForm<CurrencyForm>({
        resolver: zodResolver(currencySchema),
        defaultValues: {currency: defaultCurrency},
    });

    const linkForm = useForm<LinkForm>({
        resolver: zodResolver(linkSchema),
        defaultValues: {showSensitiveInfo: false},
    });

    const onSaveCurrency = async (data: CurrencyForm) => {
        await setCurrency.mutateAsync(data.currency.toUpperCase());
    };

    const onCreateLink = async (data: LinkForm) => {
        await createLink.mutateAsync({
            label: data.label || undefined,
            showSensitiveInfo: data.showSensitiveInfo,
            expiresAt: data.expiresAt || undefined,
        });
        setLinkDialog(false);
        linkForm.reset();
    };

    const copyToClipboard = async (url: string, id: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Paramètres</h1>
                <p className="text-muted-foreground text-sm">Configuration générale de l&apos;application</p>
            </div>

            {/* Currency */}
            <Card>
                <CardHeader>
                    <CardTitle>Devise par défaut</CardTitle>
                    <CardDescription>
                        Utilisée pour les nouvelles formules. Ne modifie pas les prix existants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={currencyForm.handleSubmit(onSaveCurrency)} className="flex gap-3 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label>Code devise</Label>
                            <Input
                                placeholder="MAD"
                                defaultValue={currency}
                                className="max-w-[120px] uppercase"
                                {...currencyForm.register('currency')}
                            />
                        </div>
                        <Button type="submit" disabled={setCurrency.isPending}>
                            {setCurrency.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </form>
                    {setCurrency.isSuccess && (
                        <p className="text-xs text-primary mt-2">Devise mise à jour avec succès.</p>
                    )}
                </CardContent>
            </Card>

            {/* Summary links */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Liens de partage</CardTitle>
                        <CardDescription>
                            Générez des liens pour partager un résumé en lecture seule avec vos comptables.
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => {
                        linkForm.reset({showSensitiveInfo: false});
                        setLinkDialog(true);
                    }}>
                        <Plus className="h-4 w-4 mr-1"/>Créer
                    </Button>
                </CardHeader>
                <CardContent>
                    {summaryLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun lien de partage.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Libellé</TableHead>
                                    <TableHead>Infos sensibles</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Expiration</TableHead>
                                    <TableHead className="w-28"/>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryLinks.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell className="font-medium">{link.label ?? 'Sans titre'}</TableCell>
                                        <TableCell>
                                            <Badge variant={link.showSensitiveInfo ? 'destructive' : 'secondary'}>
                                                {link.showSensitiveInfo ? 'Oui' : 'Non'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={link.isActive ? 'default' : 'secondary'}>
                                                {link.isActive ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('fr-FR') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8"
                                                        onClick={() => copyToClipboard(link.shareUrl, link.id)}
                                                        title="Copier le lien">
                                                    {copied === link.id ?
                                                        <Check className="h-3.5 w-3.5 text-primary"/> :
                                                        <Copy className="h-3.5 w-3.5"/>}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8"
                                                        onClick={() => toggleLink.mutateAsync({
                                                            id: link.id,
                                                            isActive: !link.isActive
                                                        })} title={link.isActive ? 'Désactiver' : 'Activer'}>
                                                    {link.isActive ?
                                                        <ToggleRight className="h-3.5 w-3.5 text-primary"/> :
                                                        <ToggleLeft className="h-3.5 w-3.5"/>}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                                        onClick={() => setDeleteTarget(link.id)} title="Supprimer">
                                                    <Trash2 className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create link dialog */}
            <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Nouveau lien de partage</DialogTitle></DialogHeader>
                    <form onSubmit={linkForm.handleSubmit(onCreateLink)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Libellé (optionnel)</Label>
                            <Input placeholder="ex: Comptable janvier" {...linkForm.register('label')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Expiration (optionnel)</Label>
                            <DatePicker
                                value={linkForm.watch('expiresAt') || undefined}
                                onChange={(v) => linkForm.setValue('expiresAt', v ?? '')}
                                fromDate={new Date()}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="showSensitive" {...linkForm.register('showSensitiveInfo')}
                                   className="h-4 w-4 rounded border-input"/>
                            <Label htmlFor="showSensitive" className="cursor-pointer text-sm">Afficher les informations
                                sensibles (montants, noms clients)</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setLinkDialog(false)}>Annuler</Button>
                            <Button type="submit"
                                    disabled={createLink.isPending}>{createLink.isPending ? 'Création…' : 'Créer le lien'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
                           title="Supprimer le lien" description="Ce lien de partage sera immédiatement invalidé."
                           onConfirm={async () => {
                               if (deleteTarget) {
                                   await deleteLink.mutateAsync(deleteTarget);
                                   setDeleteTarget(null);
                               }
                           }} loading={deleteLink.isPending}/>
        </div>
    );
}

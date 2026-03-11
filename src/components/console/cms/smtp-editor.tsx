'use client';

import {type Resolver, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useState} from 'react';
import {CheckCircle, Eye, EyeOff, Loader2, Send, XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useSetSmtpSettings, useSmtpSettings, useTestSmtp} from '@/lib/hooks/queries/use-settings.queries';
import type {SmtpSettingsDto, TestResultDto} from '@/lib/graphql/operations/settings.operations';

const smtpSchema = z.object({
    host: z.string().min(1, 'Hôte requis'),
    port: z.coerce.number().int().min(1).max(65535),
    secure: z.boolean(),
    user: z.string().min(1, 'Utilisateur requis'),
    password: z.string().optional(),
    senderEmail: z.email('Email invalide'),
    senderName: z.string().min(1, 'Nom expéditeur requis'),
});
type SmtpForm = z.infer<typeof smtpSchema>;

interface Props {
    initialSmtp?: SmtpSettingsDto | null;
}

export function SmtpEditor({initialSmtp}: Props) {
    const {data: smtp} = useSmtpSettings(initialSmtp ?? undefined);
    const setSmtp = useSetSmtpSettings();
    const testSmtp = useTestSmtp();
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState<TestResultDto | null>(null);

    const form = useForm<SmtpForm>({
        resolver: zodResolver(smtpSchema) as Resolver<SmtpForm>,
        defaultValues: {
            host: initialSmtp?.host ?? '',
            port: initialSmtp?.port ?? 587,
            secure: initialSmtp?.secure ?? false,
            user: initialSmtp?.user ?? '',
            password: '',
            senderEmail: initialSmtp?.senderEmail ?? '',
            senderName: initialSmtp?.senderName ?? '',
        },
    });

    const onSubmit = async (data: SmtpForm) => {
        await setSmtp.mutateAsync({
            host: data.host,
            port: data.port,
            secure: data.secure,
            user: data.user,
            password: data.password || undefined,
            senderEmail: data.senderEmail,
            senderName: data.senderName,
        });
        form.setValue('password', '');
    };

    const onTest = async () => {
        setTestResult(null);
        const result = await testSmtp.mutateAsync(testEmail);
        setTestResult(result);
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Configuration SMTP</h1>
                <p className="text-muted-foreground text-sm">
                    Serveur d&apos;envoi d&apos;e-mails. Le mot de passe est chiffré en base de données.
                </p>
            </div>

            {/* ── Config card ───────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle>Serveur SMTP</CardTitle>
                            <CardDescription>Paramètres de connexion au serveur d&apos;envoi.</CardDescription>
                        </div>
                        {smtp?.hasPassword && (
                            <Badge variant="secondary" className="shrink-0 mt-0.5">Mot de passe enregistré</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="smtpHost">Hôte SMTP</Label>
                                <Input id="smtpHost" placeholder="smtp-relay.brevo.com" {...form.register('host')}/>
                                {form.formState.errors.host && (
                                    <p className="text-xs text-destructive">{form.formState.errors.host.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="smtpPort">Port</Label>
                                <Input id="smtpPort" type="number" placeholder="587" {...form.register('port')}/>
                                {form.formState.errors.port && (
                                    <p className="text-xs text-destructive">{form.formState.errors.port.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="smtpSecure" type="checkbox"
                                   className="h-4 w-4 rounded border-input cursor-pointer"
                                   {...form.register('secure')}/>
                            <Label htmlFor="smtpSecure" className="cursor-pointer text-sm font-normal">
                                Connexion sécurisée TLS (port 465)
                            </Label>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                            <Input id="smtpUser" placeholder="user@smtp.example.com"
                                   autoComplete="username" {...form.register('user')}/>
                            {form.formState.errors.user && (
                                <p className="text-xs text-destructive">{form.formState.errors.user.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="smtpPassword">
                                Mot de passe
                                {smtp?.hasPassword && (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        (laisser vide pour conserver l&apos;actuel)
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="smtpPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={smtp?.hasPassword ? '••••••••' : 'Mot de passe SMTP'}
                                    autoComplete="new-password"
                                    className="pr-10"
                                    {...form.register('password')}
                                />
                                <button type="button" onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        tabIndex={-1} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="senderEmail">Email expéditeur</Label>
                                <Input id="senderEmail" type="email"
                                       placeholder="contact@example.com" {...form.register('senderEmail')}/>
                                {form.formState.errors.senderEmail && (
                                    <p className="text-xs text-destructive">{form.formState.errors.senderEmail.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="senderName">Nom expéditeur</Label>
                                <Input id="senderName" placeholder="Mon Service" {...form.register('senderName')}/>
                                {form.formState.errors.senderName && (
                                    <p className="text-xs text-destructive">{form.formState.errors.senderName.message}</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" disabled={setSmtp.isPending} className="cursor-pointer">
                            {setSmtp.isPending ? 'Enregistrement…' : 'Enregistrer la configuration SMTP'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ── Test card ─────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Tester la configuration</CardTitle>
                    <CardDescription>
                        Envoyez un e-mail de test pour vérifier que la configuration SMTP fonctionne.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label htmlFor="testEmail">Adresse e-mail de test</Label>
                            <Input
                                id="testEmail"
                                type="email"
                                placeholder="vous@exemple.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!testEmail || testSmtp.isPending || !smtp?.hasPassword}
                            onClick={onTest}
                            className="cursor-pointer gap-2"
                        >
                            {testSmtp.isPending
                                ? <Loader2 className="h-4 w-4 animate-spin"/>
                                : <Send className="h-4 w-4"/>}
                            Envoyer le test
                        </Button>
                    </div>
                    {!smtp?.hasPassword && (
                        <p className="text-xs text-muted-foreground">
                            Enregistrez d&apos;abord la configuration avec un mot de passe avant de tester.
                        </p>
                    )}
                    {testResult && (
                        <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                            testResult.success
                                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                                : 'border-destructive/30 bg-destructive/10 text-destructive'
                        }`}>
                            {testResult.success
                                ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0"/>
                                : <XCircle className="h-4 w-4 mt-0.5 shrink-0"/>}
                            <span>{testResult.message}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

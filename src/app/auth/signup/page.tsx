'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {authClient} from '@/lib/auth/auth-client';
import {clientLogger} from '@/lib/logger/client-logger';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from '@/components/ui/card';
import {Github} from 'lucide-react';

const logger = clientLogger('signup-page');

const signupSchema = z.object({
    name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Mot de passe requis (min. 8 caractères)'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<SignupForm>({resolver: zodResolver(signupSchema)});

    const onSubmit = async (data: SignupForm) => {
        setServerError(null);
        try {
            const result = await authClient.signUp.email({
                name: data.name,
                email: data.email,
                password: data.password,
                callbackURL: '/console',
            });
            if (result.error) {
                setServerError(result.error.message ?? 'Erreur lors de la création du compte');
            } else {
                router.push('/console');
            }
        } catch (err) {
            logger.error('Signup failed', err);
            setServerError('Une erreur est survenue');
        }
    };

    const handleGithub = async () => {
        await authClient.signIn.social({provider: 'github', callbackURL: '/console'});
    };


    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-1">
                <CardTitle className="text-2xl">Créer un compte</CardTitle>
                <CardDescription>
                    Créez votre accès à l&apos;espace d&apos;administration StreamManager
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGithub}
                    type="button"
                >
                    <Github className="mr-2 h-4 w-4"/>
                    Continuer avec GitHub
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"/>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {serverError && (
                        <p className="text-sm text-destructive text-center">{serverError}</p>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            placeholder="Votre nom"
                            error={errors.name?.message}
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="vous@exemple.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Création...' : 'Créer un compte'}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="justify-center text-sm text-muted-foreground">
                Déjà un compte ?&nbsp;
                <Link href="/auth/login" className="text-primary hover:underline">
                    Se connecter
                </Link>
            </CardFooter>
        </Card>
    );
}

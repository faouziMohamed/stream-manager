'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaGithub } from 'react-icons/fa';
import { z } from 'zod';

import AuthBrandLogo from '@/app/(auth)/auth-brand-logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { signIn } from '@/lib/auth/auth-client';
import { ROUTES } from '@/lib/config/routes';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setServerError(null);

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error !== undefined) {
        setServerError('Invalid credentials. Check your email and password.');
        return;
      }

      router.push(result?.url ?? callbackUrl);
    } catch (error) {
      log.error('Credentials sign in failed', error);
      setServerError('Something went wrong during sign in.');
    }
  }

  async function handleGitHubSignIn(): Promise<void> {
    await signIn('github', { callbackUrl });
  }

  return (
    <TooltipProvider>
      <Card className="border-(--sm-border) bg-(--sm-surface) shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <CardHeader className="items-center space-y-4 px-8 pt-8 text-center">
          <AuthBrandLogo size="lg" />
          <div className="space-y-2">
            <CardTitle className="text-3xl leading-tight text-(--sm-fg)">Welcome back</CardTitle>
            <CardDescription className="text-(--sm-muted)">
              Sign in with OAuth or your approved operator credentials.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-8 py-7">
          <section className="space-y-3" aria-labelledby="credentials-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="credentials-heading" className="text-sm font-semibold text-(--sm-fg)">
                Credentials
              </h2>
              <Link
                className={cn(
                  buttonVariants({ variant: 'link', size: 'sm' }),
                  'h-auto px-0 text-xs text-(--sm-coral)'
                )}
                href={ROUTES.auth.forgotPassword}
              >
                Forgot password?
              </Link>
            </div>

            {serverError === null ? null : (
              <Alert variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit, handleInvalid)}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail address</Label>
                <Input
                  icon={Mail}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  className="h-11"
                  {...register('email')}
                />
                {errors.email === undefined ? null : (
                  <p className="text-destructive text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    icon={Lock}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    className="h-11 pr-12"
                    {...register('password')}
                  />
                  <PasswordVisibilityButton
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                  />
                </div>
                {errors.password === undefined ? null : (
                  <p className="text-destructive text-xs">{errors.password.message}</p>
                )}
              </div>

              <Button
                className="h-11 w-full gap-2 border-0 bg-(--sm-coral) text-(--sm-coral-fg) hover:opacity-90"
                type="submit"
                disabled={isSubmitting}
              >
                <LockKeyhole className="size-4" />
                {isSubmitting ? 'Signing in' : 'Sign in'}
              </Button>
            </form>
          </section>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-(--sm-border)" />
            <span className="text-xs text-(--sm-muted)">Or sign in using</span>
            <Separator className="flex-1 bg-(--sm-border)" />
          </div>

          <section className="grid gap-3" aria-label="OAuth providers">
            <Button
              className="h-11 border-0 bg-[#24292f] text-white hover:bg-[#1f2328] hover:text-white"
              variant="default"
              type="button"
              onClick={() => void handleGitHubSignIn()}
            >
              <FaGithub className="size-5" />
              GitHub
            </Button>
          </section>

          <div className="rounded-xl border border-(--sm-border) bg-(--sm-surface2) p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--sm-emerald)" />
              <p className="text-sm leading-6 text-(--sm-muted)">
                By signing in, you accept operator access rules. Accounts are approved manually
                while public registration is disabled.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-center border-t border-(--sm-border) bg-(--sm-surface2) px-8 py-5">
          <p className="text-center text-sm text-(--sm-muted)">
            Need an account?{' '}
            <Link
              className="font-medium text-(--sm-coral) hover:underline"
              href={ROUTES.auth.login}
            >
              Request access
            </Link>
          </p>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

const log = clientLogger('login-form');

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  callbackUrl: string;
};

type PasswordVisibilityButtonProps = {
  showPassword: boolean;
  onToggle: () => void;
};

function PasswordVisibilityButton({ showPassword, onToggle }: PasswordVisibilityButtonProps) {
  const label = showPassword ? 'Hide password' : 'Show password';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            className="absolute top-1 right-1 size-8 border-0 bg-transparent text-(--sm-muted) hover:bg-(--sm-hover) hover:text-(--sm-fg)"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={label}
          />
        }
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function handleInvalid() {
  // React Hook Form focuses the first invalid control and exposes inline errors.
}

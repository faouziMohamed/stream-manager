'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LockKeyhole, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth/auth-client';

const reloginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type ReloginFormValues = z.infer<typeof reloginSchema>;

type ReloginDialogProps = {
  open: boolean;
  onAuthenticated: () => Promise<void> | void;
};

export function ReloginDialog({ open, onAuthenticated }: ReloginDialogProps) {
  const pathname = usePathname();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReloginFormValues>({
    resolver: zodResolver(reloginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: ReloginFormValues): Promise<void> {
    setServerError(null);

    const result = await signIn('credentials', {
      callbackUrl: pathname,
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error !== undefined) {
      setServerError('Invalid credentials. Check your email and password.');
      return;
    }

    await onAuthenticated();
  }

  function onInvalid(): void {
    setServerError('Check the highlighted fields and try again.');
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Session expired</DialogTitle>
          <DialogDescription>
            Sign in again to continue the action without leaving this page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <DialogBody className="space-y-4">
            {serverError !== null && <p className="text-destructive text-sm">{serverError}</p>}

            <div className="space-y-1.5">
              <Label htmlFor="relogin-email">E-mail address</Label>
              <Input
                icon={Mail}
                id="relogin-email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email !== undefined && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relogin-password">Password</Label>
              <Input
                icon={Lock}
                id="relogin-password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register('password')}
              />
              {errors.password !== undefined && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              <LockKeyhole className="size-4" />
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

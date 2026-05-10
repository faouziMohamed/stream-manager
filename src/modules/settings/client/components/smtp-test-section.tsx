'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Send, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTestSmtp } from '@/lib/hooks/queries/use-settings.queries';
import type { TestResultDto } from '@/lib/graphql/operations/settings.operations';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger('smtp-test-section');

export function SmtpTestSection({ hasPassword }: { hasPassword: boolean }) {
  const testSmtp = useTestSmtp();
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<TestResultDto | null>(null);

  const onTest = async () => {
    setTestResult(null);
    try {
      const result = await testSmtp.mutateAsync(testEmail);
      setTestResult(result);
    } catch (error) {
      logger.error('SMTP test failed', error);
      setTestResult({
        success: false,
        message: 'Erreur de connexion au serveur. Vérifiez votre session.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tester la configuration</CardTitle>
        <CardDescription>
          Envoyez un e-mail de test pour vérifier que la configuration SMTP fonctionne.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onTest();
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="testEmail">Adresse e-mail de test</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="vous@exemple.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!testEmail || testSmtp.isPending || !hasPassword}
            className="border-border bg-background hover:bg-muted hover:text-foreground inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs transition-all disabled:pointer-events-none disabled:opacity-50"
          >
            {testSmtp.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer le test
          </button>
        </form>
        {!hasPassword && (
          <p className="text-muted-foreground text-xs">
            Enregistrez d&apos;abord la configuration avec un mot de passe avant de tester.
          </p>
        )}
        {testResult && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              testResult.success
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

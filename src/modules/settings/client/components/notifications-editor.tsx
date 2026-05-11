'use client';

import { Bell, BellOff, CheckCircle2, Mail, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  useNotificationHistory,
  useNotificationSettings,
  useSetNotificationSetting,
} from '@/lib/hooks/queries/use-notifications.queries';
import { cn } from '@/lib/utils/helpers';
import type { NotificationSettingDto } from '@/lib/graphql/operations/settings.operations';

interface Props {
  initialData?: NotificationSettingDto[];
}

// Icon + colour per event type
const EVENT_META: Record<string, { emoji: string; description: string }> = {
  new_inquiry: {
    emoji: '📩',
    description: "Reçu lorsqu'un visiteur envoie un message depuis le formulaire de contact.",
  },
  payment_overdue: {
    emoji: '⚠️',
    description: "Reçu lorsqu'un paiement passe en statut « En retard ».",
  },
  payment_paid: {
    emoji: '✅',
    description: "Reçu lorsqu'un paiement est marqué comme payé.",
  },
  subscription_created: {
    emoji: '🆕',
    description: "Reçu lorsqu'un nouvel abonnement est créé.",
  },
  subscription_renewed: {
    emoji: '🔄',
    description: "Reçu lorsqu'un abonnement est renouvelé.",
  },
  subscription_expiring: {
    emoji: '⏰',
    description: "Reçu lorsqu'un abonnement arrive bientôt à expiration.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsEditor({ initialData }: Props) {
  const { data: settings = [] } = useNotificationSettings(initialData);
  const { data: history = [], isLoading: historyLoading, refetch } = useNotificationHistory(50);
  const setNotification = useSetNotificationSetting();

  const enabledCount = settings.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6" />
            Notifications par e-mail
          </h1>
          <p className="text-muted-foreground text-sm">
            Choisissez quels événements déclenchent un e-mail vers votre adresse d&apos;expéditeur
            SMTP.
          </p>
        </div>
        <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
          {enabledCount} / {settings.length} activées
        </Badge>
      </div>

      {/* Toggle cards */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Événements</CardTitle>
          <CardDescription>
            Les notifications sont envoyées à l&apos;adresse e-mail configurée dans les paramètres
            SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          {settings.map((setting, idx) => {
            const meta = EVENT_META[setting.event];
            return (
              <div key={setting.event}>
                {idx > 0 && <Separator />}
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="shrink-0 text-2xl" aria-hidden>
                    {meta?.emoji ?? '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {meta?.description ?? ''}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setNotification.mutate({
                        event: setting.event,
                        enabled: !setting.enabled,
                      })
                    }
                    disabled={setNotification.isPending}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                      'transition-colors duration-200 ease-in-out focus:outline-none',
                      'disabled:opacity-50',
                      setting.enabled ? 'bg-primary' : 'bg-muted'
                    )}
                    role="switch"
                    aria-checked={setting.enabled}
                    aria-label={`${setting.enabled ? 'Désactiver' : 'Activer'} : ${setting.label}`}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
                        'transform transition duration-200 ease-in-out',
                        setting.enabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  {setting.enabled ? (
                    <Bell className="text-primary h-4 w-4 shrink-0" />
                  ) : (
                    <BellOff className="text-muted-foreground h-4 w-4 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notification history */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Historique des envois
              </CardTitle>
              <CardDescription>50 dernières notifications tentées</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={historyLoading}
              className="hover:bg-muted cursor-pointer rounded-md p-1.5 disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={cn('h-4 w-4', historyLoading && 'animate-spin')} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="text-muted-foreground px-6 py-8 text-center text-sm">Chargement…</div>
          ) : (history.length === 0 ? (
            <div className="text-muted-foreground px-6 py-8 text-center text-sm italic">
              Aucune notification envoyée pour l&apos;instant.
            </div>
          ) : (
            <div className="divide-y">
              {history.map((evt) => {
                const meta = EVENT_META[evt.event];
                return (
                  <div key={evt.id} className="flex items-start gap-3 px-6 py-3">
                    {evt.success ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {meta?.emoji} {evt.subject}
                        </span>
                        <Badge
                          variant={evt.success ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {evt.success ? 'Envoyé' : 'Échec'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        À : {evt.toEmail} · {formatDate(evt.createdAt)}
                      </p>
                      {evt.errorMessage && (
                        <p className="text-destructive mt-1 font-mono text-xs">
                          {evt.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  Bell,
  BellOff,
  CheckCircle2,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationHistory,
  useNotificationSettings,
  useSetNotificationSetting,
} from "@/lib/hooks/queries/use-settings.queries";
import { cn } from "@/lib/utils/helpers";
import type { NotificationSettingDto } from "@/lib/graphql/operations/settings.operations";

interface Props {
  initialData?: NotificationSettingDto[];
}

// Icon + colour per event type
const EVENT_META: Record<string, { emoji: string; description: string }> = {
  new_inquiry: {
    emoji: "📩",
    description:
      "Reçu lorsqu'un visiteur envoie un message depuis le formulaire de contact.",
  },
  payment_overdue: {
    emoji: "⚠️",
    description: "Reçu lorsqu'un paiement passe en statut « En retard ».",
  },
  payment_paid: {
    emoji: "✅",
    description: "Reçu lorsqu'un paiement est marqué comme payé.",
  },
  subscription_created: {
    emoji: "🆕",
    description: "Reçu lorsqu'un nouvel abonnement est créé.",
  },
  subscription_renewed: {
    emoji: "🔄",
    description: "Reçu lorsqu'un abonnement est renouvelé.",
  },
  subscription_expiring: {
    emoji: "⏰",
    description: "Reçu lorsqu'un abonnement arrive bientôt à expiration.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsEditor({ initialData }: Props) {
  const { data: settings = [] } = useNotificationSettings(initialData);
  const {
    data: history = [],
    isLoading: historyLoading,
    refetch,
  } = useNotificationHistory(50);
  const setNotification = useSetNotificationSetting();

  const enabledCount = settings.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications par e-mail
          </h1>
          <p className="text-muted-foreground text-sm">
            Choisissez quels événements déclenchent un e-mail vers votre adresse
            d&apos;expéditeur SMTP.
          </p>
        </div>
        <Badge variant={enabledCount > 0 ? "default" : "secondary"}>
          {enabledCount} / {settings.length} activées
        </Badge>
      </div>

      {/* Toggle cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Événements</CardTitle>
          <CardDescription>
            Les notifications sont envoyées à l&apos;adresse e-mail configurée
            dans les paramètres SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          {settings.map((setting, idx) => {
            const meta = EVENT_META[setting.event];
            return (
              <div key={setting.event}>
                {idx > 0 && <Separator />}
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {meta?.emoji ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{setting.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meta?.description ?? ""}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() =>
                      setNotification.mutate({
                        event: setting.event,
                        enabled: !setting.enabled,
                      })
                    }
                    disabled={setNotification.isPending}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                      "transition-colors duration-200 ease-in-out focus:outline-none",
                      "disabled:opacity-50",
                      setting.enabled ? "bg-primary" : "bg-muted",
                    )}
                    role="switch"
                    aria-checked={setting.enabled}
                    aria-label={`${setting.enabled ? "Désactiver" : "Activer"} : ${setting.label}`}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg",
                        "transform transition duration-200 ease-in-out",
                        setting.enabled ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                  {setting.enabled ? (
                    <Bell className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notification history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Historique des envois
              </CardTitle>
              <CardDescription>
                50 dernières notifications tentées
              </CardDescription>
            </div>
            <button
              onClick={() => refetch()}
              disabled={historyLoading}
              className="p-1.5 rounded-md hover:bg-muted cursor-pointer disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw
                className={cn("h-4 w-4", historyLoading && "animate-spin")}
              />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : history.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground italic">
              Aucune notification envoyée pour l&apos;instant.
            </div>
          ) : (
            <div className="divide-y">
              {history.map((evt) => {
                const meta = EVENT_META[evt.event];
                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 px-6 py-3"
                  >
                    {evt.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {meta?.emoji} {evt.subject}
                        </span>
                        <Badge
                          variant={evt.success ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {evt.success ? "Envoyé" : "Échec"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        À : {evt.toEmail} · {formatDate(evt.createdAt)}
                      </p>
                      {evt.errorMessage && (
                        <p className="text-xs text-destructive mt-1 font-mono">
                          {evt.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

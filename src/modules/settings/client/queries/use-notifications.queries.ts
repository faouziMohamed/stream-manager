'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '@/lib/graphql/client';
import {
  type NotificationEventDto,
  type NotificationSettingDto,
  GET_NOTIFICATION_HISTORY,
  GET_NOTIFICATION_SETTINGS,
  SET_NOTIFICATION_SETTING,
} from '@/modules/settings/client/graphql/notifications.operations';
import {
  type InquiryDto,
  DELETE_INQUIRY,
  GET_INQUIRIES,
  MARK_INQUIRY_READ,
  REPLY_TO_INQUIRY,
} from '@/modules/settings/client/graphql/inquiries.operations';
import { settingsKeys } from '@/modules/settings/client/queries/use-settings.queries';
import { toastError, toastSuccess } from '@/lib/utils/toast';

// ─── Inquiry hooks ────────────────────────────────────────────────────────────

export function useInquiries(unreadOnly?: boolean, initialData?: InquiryDto[]) {
  return useQuery({
    queryKey: settingsKeys.inquiries(unreadOnly),
    queryFn: () =>
      gqlRequest<{ inquiries: InquiryDto[] }>(GET_INQUIRIES, {
        unreadOnly,
      }).then((r) => r.inquiries),
    initialData,
  });
}

export function useMarkInquiryRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      gqlRequest<{ markInquiryRead: InquiryDto }>(MARK_INQUIRY_READ, {
        id,
        isRead,
      }).then((r) => r.markInquiryRead),
    onMutate: async ({ id, isRead }) => {
      await qc.cancelQueries({ queryKey: settingsKeys.inquiries() });
      const prev = qc.getQueryData<InquiryDto[]>(settingsKeys.inquiries());
      qc.setQueryData<InquiryDto[]>(settingsKeys.inquiries(), (old) =>
        old?.map((i) => (i.id === id ? { ...i, isRead } : i))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.inquiries(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.inquiries() }),
  });
}

export function useReplyToInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      gqlRequest(REPLY_TO_INQUIRY, { id, body }),
    onSuccess: (_, { id }) => {
      toastSuccess('Réponse envoyée');
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries() });
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries(false) });
      qc.invalidateQueries({ queryKey: ['settings', 'inquiries', id] });
    },
    onError: (err) => toastError(err, 'Envoi de la réponse'),
  });
}

export function useDeleteInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_INQUIRY, { id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: settingsKeys.inquiries() });
      const prev = qc.getQueryData<InquiryDto[]>(settingsKeys.inquiries());
      qc.setQueryData<InquiryDto[]>(settingsKeys.inquiries(), (old) =>
        old?.filter((i) => i.id !== id)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.inquiries(), ctx.prev);
    },
    onSuccess: () => toastSuccess('Message supprimé'),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.inquiries() }),
  });
}

// ─── Notification settings hooks ─────────────────────────────────────────────

export function useNotificationSettings(initialData?: NotificationSettingDto[]) {
  return useQuery({
    queryKey: settingsKeys.notificationSettings,
    queryFn: () =>
      gqlRequest<{ notificationSettings: NotificationSettingDto[] }>(
        GET_NOTIFICATION_SETTINGS
      ).then((r) => r.notificationSettings),
    initialData,
  });
}

export function useNotificationHistory(limit?: number) {
  return useQuery({
    queryKey: settingsKeys.notificationHistory(limit),
    queryFn: () =>
      gqlRequest<{ notificationHistory: NotificationEventDto[] }>(GET_NOTIFICATION_HISTORY, {
        limit,
      }).then((r) => r.notificationHistory),
  });
}

export function useSetNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ event, enabled }: { event: string; enabled: boolean }) =>
      gqlRequest<{ setNotificationSetting: NotificationSettingDto }>(SET_NOTIFICATION_SETTING, {
        event,
        enabled,
      }).then((r) => r.setNotificationSetting),
    onMutate: async ({ event, enabled }) => {
      await qc.cancelQueries({ queryKey: settingsKeys.notificationSettings });
      const prev = qc.getQueryData<NotificationSettingDto[]>(settingsKeys.notificationSettings);
      qc.setQueryData<NotificationSettingDto[]>(
        settingsKeys.notificationSettings,
        (old) => old?.map((s) => (s.event === event ? { ...s, enabled } : s)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.notificationSettings, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.notificationSettings }),
  });
}

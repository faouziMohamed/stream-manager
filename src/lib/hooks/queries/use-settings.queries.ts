"use client";

import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql/client";
import {
  type AppSettingDto,
  type CloudinarySettingsDto,
  type CloudinarySettingsInput,
  type CloudinaryTestResultDto,
  CREATE_SUMMARY_LINK,
  DELETE_FROM_CLOUDINARY,
  DELETE_INQUIRY,
  DELETE_SUMMARY_LINK,
  GET_CLOUDINARY_SETTINGS,
  GET_DEFAULT_CURRENCY,
  GET_INQUIRIES,
  GET_SMTP_SETTINGS,
  GET_SUMMARY_LINKS,
  type InquiryDto,
  MARK_INQUIRY_READ,
  REPLACE_CLOUDINARY_IMAGE,
  REPLY_TO_INQUIRY,
  SET_APP_SETTING,
  SET_CLOUDINARY_SETTINGS,
  SET_SMTP_SETTINGS,
  type SmtpSettingsDto,
  type SmtpSettingsInput,
  type SummaryLinkDto,
  TEST_CLOUDINARY,
  TEST_SMTP,
  type TestResultDto,
  TOGGLE_SUMMARY_LINK,
  UPLOAD_TO_CLOUDINARY,
} from "@/lib/graphql/operations/settings.operations";
import { toastError, toastSuccess } from "@/lib/utils/toast";

export const settingsKeys = {
  currency: ["settings", "defaultCurrency"] as QueryKey,
  summaryLinks: ["settings", "summaryLinks"] as QueryKey,
  smtp: ["settings", "smtp"] as QueryKey,
  cloudinary: ["settings", "cloudinary"] as QueryKey,
  media: (folder?: string) =>
    ["settings", "cloudinaryMedia", folder ?? "all"] as QueryKey,
  inquiries: (unreadOnly?: boolean) =>
    ["settings", "inquiries", unreadOnly ?? false] as QueryKey,
};

// ─── Currency settings hooks ─────────────────────────────────────────────────

export function useDefaultCurrency(initialData?: string) {
  return useQuery({
    queryKey: settingsKeys.currency,
    queryFn: () =>
      gqlRequest<{ defaultCurrency: string }>(GET_DEFAULT_CURRENCY).then(
        (r) => r.defaultCurrency,
      ),
    initialData,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

export function useSetDefaultCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) =>
      gqlRequest<{ setAppSetting: AppSettingDto }>(SET_APP_SETTING, {
        key: "defaultCurrency",
        value: currency,
      }).then((r) => r.setAppSetting),
    onMutate: async (currency) => {
      await qc.cancelQueries({ queryKey: settingsKeys.currency });
      const prev = qc.getQueryData<string>(settingsKeys.currency);
      qc.setQueryData(settingsKeys.currency, currency);
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Changement de devise");
      if (ctx?.prev) qc.setQueryData(settingsKeys.currency, ctx.prev);
    },
    onSuccess: () => toastSuccess("Devise mise à jour"),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.currency }),
  });
}

// ─── Summary links hooks ─────────────────────────────────────────────────────

export function useSummaryLinks(initialData?: SummaryLinkDto[]) {
  return useQuery({
    queryKey: settingsKeys.summaryLinks,
    queryFn: () =>
      gqlRequest<{ summaryLinks: SummaryLinkDto[] }>(GET_SUMMARY_LINKS).then(
        (r) => r.summaryLinks,
      ),
    initialData,
  });
}

export function useCreateSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      label?: string;
      showSensitiveInfo: boolean;
      expiresAt?: string;
    }) =>
      gqlRequest<{ createSummaryLink: SummaryLinkDto }>(
        CREATE_SUMMARY_LINK,
        input,
      ).then((r) => r.createSummaryLink),
    onSuccess: () => toastSuccess("Lien de partage créé"),
    onError: (err) => toastError(err, "Création du lien de partage"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}

export function useDeleteSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteSummaryLink: boolean }>(DELETE_SUMMARY_LINK, {
        id,
      }).then((r) => r.deleteSummaryLink),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: settingsKeys.summaryLinks });
      const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
      qc.setQueryData<SummaryLinkDto[]>(
        settingsKeys.summaryLinks,
        (old) => old?.filter((l) => l.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Suppression du lien de partage");
      if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
    },
    onSuccess: () => toastSuccess("Lien de partage supprimé"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}

export function useToggleSummaryLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      gqlRequest<{ toggleSummaryLink: SummaryLinkDto }>(TOGGLE_SUMMARY_LINK, {
        id,
        isActive,
      }).then((r) => r.toggleSummaryLink),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: settingsKeys.summaryLinks });
      const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
      qc.setQueryData<SummaryLinkDto[]>(
        settingsKeys.summaryLinks,
        (old) => old?.map((l) => (l.id === id ? { ...l, isActive } : l)) ?? [],
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      toastError(err, "Activation du lien de partage");
      if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
    },
    onSuccess: (
      _data: SummaryLinkDto,
      vars: { id: string; isActive: boolean },
    ) => toastSuccess(vars.isActive ? "Lien activé" : "Lien désactivé"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.summaryLinks }),
  });
}

// ─── SMTP settings hooks ─────────────────────────────────────────────────────

export function useSmtpSettings(initialData?: SmtpSettingsDto) {
  return useQuery({
    queryKey: settingsKeys.smtp,
    queryFn: () =>
      gqlRequest<{ smtpSettings: SmtpSettingsDto }>(GET_SMTP_SETTINGS).then(
        (r) => r.smtpSettings,
      ),
    initialData,
  });
}

export function useSetSmtpSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SmtpSettingsInput) =>
      gqlRequest<{ setSmtpSettings: SmtpSettingsDto }>(SET_SMTP_SETTINGS, {
        input,
      }).then((r) => r.setSmtpSettings),
    onSuccess: () => toastSuccess("Configuration SMTP enregistrée"),
    onError: (err) => toastError(err, "Enregistrement SMTP"),
    onSettled: () => qc.invalidateQueries({ queryKey: settingsKeys.smtp }),
  });
}

export function useTestSmtp() {
  return useMutation({
    mutationFn: (toEmail: string) =>
      gqlRequest<{ testSmtp: TestResultDto }>(TEST_SMTP, { toEmail }).then(
        (r) => r.testSmtp,
      ),
  });
}

// ─── Cloudinary settings hooks ────────────────────────────────────────────────

export function useCloudinarySettings(initialData?: CloudinarySettingsDto) {
  return useQuery({
    queryKey: settingsKeys.cloudinary,
    queryFn: () =>
      gqlRequest<{ cloudinarySettings: CloudinarySettingsDto }>(
        GET_CLOUDINARY_SETTINGS,
      ).then((r) => r.cloudinarySettings),
    initialData,
  });
}

export function useSetCloudinarySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CloudinarySettingsInput) =>
      gqlRequest<{ setCloudinarySettings: CloudinarySettingsDto }>(
        SET_CLOUDINARY_SETTINGS,
        { input },
      ).then((r) => r.setCloudinarySettings),
    onSuccess: () => toastSuccess("Configuration Cloudinary enregistrée"),
    onError: (err) => toastError(err, "Enregistrement Cloudinary"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.cloudinary }),
  });
}

export function useTestCloudinary() {
  return useMutation({
    mutationFn: () =>
      gqlRequest<{ testCloudinary: CloudinaryTestResultDto }>(
        TEST_CLOUDINARY,
      ).then((r) => r.testCloudinary),
  });
}

export function useUploadToCloudinary() {
  return useMutation({
    mutationFn: ({ base64, filename }: { base64: string; filename?: string }) =>
      gqlRequest<{ uploadToCloudinary: CloudinaryTestResultDto }>(
        UPLOAD_TO_CLOUDINARY,
        { base64, filename },
      ).then((r) => r.uploadToCloudinary),
  });
}

export function useDeleteFromCloudinary() {
  return useMutation({
    mutationFn: (publicId: string) =>
      gqlRequest<{ deleteFromCloudinary: TestResultDto }>(
        DELETE_FROM_CLOUDINARY,
        { publicId },
      ).then((r) => r.deleteFromCloudinary),
  });
}

export function useReplaceCloudinaryImage() {
  return useMutation({
    mutationFn: ({
      oldPublicId,
      base64,
      filename,
    }: {
      oldPublicId: string;
      base64: string;
      filename?: string;
    }) =>
      gqlRequest<{ replaceCloudinaryImage: CloudinaryTestResultDto }>(
        REPLACE_CLOUDINARY_IMAGE,
        {
          oldPublicId,
          base64,
          filename,
        },
      ).then((r) => r.replaceCloudinaryImage),
    onSuccess: () => toastSuccess("Image remplacée"),
    onError: (err) => toastError(err, "Remplacement image"),
  });
}

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
        old?.map((i) => (i.id === id ? { ...i, isRead } : i)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.inquiries(), ctx.prev);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries() }),
  });
}

export function useReplyToInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      gqlRequest(REPLY_TO_INQUIRY, { id, body }),
    onSuccess: (_, { id }) => {
      toastSuccess("Réponse envoyée");
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries() });
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries(false) });
      qc.invalidateQueries({ queryKey: ["settings", "inquiries", id] });
    },
    onError: (err) => toastError(err, "Envoi de la réponse"),
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
        old?.filter((i) => i.id !== id),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.inquiries(), ctx.prev);
    },
    onSuccess: () => toastSuccess("Message supprimé"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.inquiries() }),
  });
}

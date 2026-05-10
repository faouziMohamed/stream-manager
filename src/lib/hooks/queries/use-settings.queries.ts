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
  type CloudinaryResourceDto,
  type CloudinarySettingsDto,
  type CloudinarySettingsInput,
  type CloudinaryTestResultDto,
  DELETE_FROM_CLOUDINARY,
  GET_CLOUDINARY_MEDIA,
  GET_CLOUDINARY_SETTINGS,
  GET_DEFAULT_CURRENCY,
  GET_SMTP_SETTINGS,
  REPLACE_CLOUDINARY_IMAGE,
  SET_APP_SETTING,
  SET_CLOUDINARY_SETTINGS,
  SET_SMTP_SETTINGS,
  type SmtpSettingsDto,
  type SmtpSettingsInput,
  TEST_CLOUDINARY,
  TEST_SMTP,
  type TestResultDto,
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
  notificationSettings: ["settings", "notificationSettings"] as QueryKey,
  notificationHistory: (limit?: number) =>
    ["settings", "notificationHistory", limit ?? 50] as QueryKey,
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
    staleTime: 5 * 60_000,
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

export function useCloudinaryMedia(folder?: string) {
  return useQuery({
    queryKey: settingsKeys.media(folder),
    queryFn: () =>
      gqlRequest<{ cloudinaryMedia: CloudinaryResourceDto[] }>(
        GET_CLOUDINARY_MEDIA,
        { folder },
      ).then((r) => r.cloudinaryMedia),
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

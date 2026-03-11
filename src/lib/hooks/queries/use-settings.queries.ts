'use client';

import {type QueryKey, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {gqlRequest} from '@/lib/graphql/client';
import {
    type AppSettingDto,
    type CloudinaryResourceDto,
    type CloudinarySettingsDto,
    type CloudinarySettingsInput,
    type CloudinaryTestResultDto,
    CREATE_SUMMARY_LINK,
    DELETE_FROM_CLOUDINARY,
    DELETE_SUMMARY_LINK,
    GET_CLOUDINARY_MEDIA,
    GET_CLOUDINARY_SETTINGS,
    GET_DEFAULT_CURRENCY,
    GET_SMTP_SETTINGS,
    GET_SUMMARY_LINKS,
    REPLACE_CLOUDINARY_IMAGE,
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
} from '@/lib/graphql/operations/settings.operations';
import {toastError, toastSuccess} from '@/lib/utils/toast';

export const settingsKeys = {
    currency: ['settings', 'defaultCurrency'] as QueryKey,
    summaryLinks: ['settings', 'summaryLinks'] as QueryKey,
    smtp: ['settings', 'smtp'] as QueryKey,
    cloudinary: ['settings', 'cloudinary'] as QueryKey,
    media: (folder?: string) => ['settings', 'cloudinaryMedia', folder ?? 'all'] as QueryKey,
};

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
                key: 'defaultCurrency',
                value: currency,
            }).then((r) => r.setAppSetting),
        onMutate: async (currency) => {
            await qc.cancelQueries({queryKey: settingsKeys.currency});
            const prev = qc.getQueryData<string>(settingsKeys.currency);
            qc.setQueryData(settingsKeys.currency, currency);
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Changement de devise');
            if (ctx?.prev) qc.setQueryData(settingsKeys.currency, ctx.prev);
        },
        onSuccess: () => toastSuccess('Devise mise à jour'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.currency}),
    });
}

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
        mutationFn: (input: { label?: string; showSensitiveInfo: boolean; expiresAt?: string }) =>
            gqlRequest<{ createSummaryLink: SummaryLinkDto }>(CREATE_SUMMARY_LINK, input).then(
                (r) => r.createSummaryLink,
            ),
        onSuccess: () => toastSuccess('Lien de partage créé'),
        onError: (err) => toastError(err, 'Création du lien de partage'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}

export function useDeleteSummaryLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            gqlRequest<{ deleteSummaryLink: boolean }>(DELETE_SUMMARY_LINK, {id}).then(
                (r) => r.deleteSummaryLink,
            ),
        onMutate: async (id) => {
            await qc.cancelQueries({queryKey: settingsKeys.summaryLinks});
            const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
            qc.setQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks, (old) =>
                old?.filter((l) => l.id !== id) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Suppression du lien de partage');
            if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
        },
        onSuccess: () => toastSuccess('Lien de partage supprimé'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}

export function useToggleSummaryLink() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, isActive}: { id: string; isActive: boolean }) =>
            gqlRequest<{ toggleSummaryLink: SummaryLinkDto }>(TOGGLE_SUMMARY_LINK, {id, isActive}).then(
                (r) => r.toggleSummaryLink,
            ),
        onMutate: async ({id, isActive}) => {
            await qc.cancelQueries({queryKey: settingsKeys.summaryLinks});
            const prev = qc.getQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks);
            qc.setQueryData<SummaryLinkDto[]>(settingsKeys.summaryLinks, (old) =>
                old?.map((l) => (l.id === id ? {...l, isActive} : l)) ?? [],
            );
            return {prev};
        },
        onError: (err, _, ctx) => {
            toastError(err, 'Activation du lien de partage');
            if (ctx?.prev) qc.setQueryData(settingsKeys.summaryLinks, ctx.prev);
        },
        onSuccess: (_data: SummaryLinkDto, vars: { id: string; isActive: boolean }) =>
            toastSuccess(vars.isActive ? 'Lien activé' : 'Lien désactivé'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.summaryLinks}),
    });
}

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
            gqlRequest<{ setSmtpSettings: SmtpSettingsDto }>(SET_SMTP_SETTINGS, {input}).then(
                (r) => r.setSmtpSettings,
            ),
        onSuccess: () => toastSuccess('Configuration SMTP enregistrée'),
        onError: (err) => toastError(err, 'Enregistrement SMTP'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.smtp}),
    });
}

export function useTestSmtp() {
    return useMutation({
        mutationFn: (toEmail: string) =>
            gqlRequest<{ testSmtp: TestResultDto }>(TEST_SMTP, {toEmail}).then((r) => r.testSmtp),
    });
}

export function useCloudinarySettings(initialData?: CloudinarySettingsDto) {
    return useQuery({
        queryKey: settingsKeys.cloudinary,
        queryFn: () =>
            gqlRequest<{ cloudinarySettings: CloudinarySettingsDto }>(GET_CLOUDINARY_SETTINGS).then(
                (r) => r.cloudinarySettings,
            ),
        initialData,
    });
}

export function useSetCloudinarySettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CloudinarySettingsInput) =>
            gqlRequest<{ setCloudinarySettings: CloudinarySettingsDto }>(SET_CLOUDINARY_SETTINGS, {input}).then(
                (r) => r.setCloudinarySettings,
            ),
        onSuccess: () => toastSuccess('Configuration Cloudinary enregistrée'),
        onError: (err) => toastError(err, 'Enregistrement Cloudinary'),
        onSettled: () => qc.invalidateQueries({queryKey: settingsKeys.cloudinary}),
    });
}

export function useTestCloudinary() {
    return useMutation({
        mutationFn: () =>
            gqlRequest<{ testCloudinary: CloudinaryTestResultDto }>(TEST_CLOUDINARY).then(
                (r) => r.testCloudinary,
            ),
    });
}

export function useUploadToCloudinary() {
    return useMutation({
        mutationFn: ({base64, filename}: { base64: string; filename?: string }) =>
            gqlRequest<{ uploadToCloudinary: CloudinaryTestResultDto }>(UPLOAD_TO_CLOUDINARY, {base64, filename}).then(
                (r) => r.uploadToCloudinary,
            ),
    });
}

export function useDeleteFromCloudinary() {
    return useMutation({
        mutationFn: (publicId: string) =>
            gqlRequest<{ deleteFromCloudinary: TestResultDto }>(DELETE_FROM_CLOUDINARY, {publicId}).then(
                (r) => r.deleteFromCloudinary,
            ),
    });
}

export function useReplaceCloudinaryImage() {
    return useMutation({
        mutationFn: ({oldPublicId, base64, filename}: { oldPublicId: string; base64: string; filename?: string }) =>
            gqlRequest<{ replaceCloudinaryImage: CloudinaryTestResultDto }>(REPLACE_CLOUDINARY_IMAGE, {
                oldPublicId,
                base64,
                filename
            }).then(
                (r) => r.replaceCloudinaryImage,
            ),
        onSuccess: () => toastSuccess('Image remplacée'),
        onError: (err) => toastError(err, 'Remplacement image'),
    });
}

export function useCloudinaryMedia(folder?: string) {
    return useQuery({
        queryKey: settingsKeys.media(folder),
        queryFn: () =>
            gqlRequest<{ cloudinaryMedia: CloudinaryResourceDto[] }>(GET_CLOUDINARY_MEDIA, {folder}).then(
                (r) => r.cloudinaryMedia,
            ),
    });
}

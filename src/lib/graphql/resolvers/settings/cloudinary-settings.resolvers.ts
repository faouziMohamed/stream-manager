import { requireAdmin } from "@/lib/graphql/resolvers/guards";
import { createLogger } from "@/lib/logger";
import {
  getCloudinaryApiSecret,
  getCloudinarySettings,
  saveCloudinarySettings,
} from "@/lib/db/repositories/settings";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("cloudinary-settings-resolvers");

export const cloudinarySettingsQueryResolvers = {
  cloudinarySettings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return getCloudinarySettings();
  },
  cloudinaryMedia: async (
    _: unknown,
    { folder }: { folder?: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const settings = await getCloudinarySettings();
    const apiSecret = await getCloudinaryApiSecret();
    if (!settings.cloudName || !settings.apiKey || !apiSecret) return [];
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: settings.cloudName,
        api_key: settings.apiKey,
        api_secret: apiSecret,
      });
      const prefix = folder ?? settings.folder ?? "streammanager";
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix,
        max_results: 200,
        resource_type: "image",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result.resources ?? []).map((r: any) => ({
        publicId: r.public_id,
        url: r.secure_url,
        format: r.format ?? "",
        width: r.width ?? 0,
        height: r.height ?? 0,
        bytes: r.bytes ?? 0,
        folder: r.folder ?? r.asset_folder ?? "",
        createdAt: r.created_at ?? "",
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err, msg }, "cloudinaryMedia query failed");
      return [];
    }
  },
};

export const cloudinarySettingsMutationResolvers = {
  setCloudinarySettings: async (
    _: unknown,
    {
      input,
    }: {
      input: {
        cloudName: string;
        apiKey: string;
        apiSecret?: string;
        uploadPreset?: string;
        folder?: string;
      };
    },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const result = await saveCloudinarySettings(input);
    logger.info("Cloudinary settings updated");
    return result;
  },
  testCloudinary: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const settings = await getCloudinarySettings();
    if (!settings.cloudName || !settings.apiKey) {
      return {
        success: false,
        message: "Configuration Cloudinary incomplète.",
        publicId: null,
        url: null,
      };
    }
    const apiSecret = await getCloudinaryApiSecret();
    if (!apiSecret) {
      return {
        success: false,
        message: "API Secret Cloudinary manquant.",
        publicId: null,
        url: null,
      };
    }
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: settings.cloudName,
        api_key: settings.apiKey,
        api_secret: apiSecret,
      });
      const testImageBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const folder = settings.folder ?? "streammanager";
      const uploadResult = await cloudinary.uploader.upload(testImageBase64, {
        folder: `${folder}/tests`,
        public_id: `test_${Date.now()}`,
      });
      await cloudinary.uploader.destroy(uploadResult.public_id);
      logger.info(
        { publicId: uploadResult.public_id },
        "Test Cloudinary réussi (upload + suppression)",
      );
      return {
        success: true,
        message: "Upload et suppression réussis.",
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    } catch (err) {
      logger.error({ err }, "Test Cloudinary échoué");
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return {
        success: false,
        message: `Échec : ${message}`,
        publicId: null,
        url: null,
      };
    }
  },
  uploadToCloudinary: async (
    _: unknown,
    { base64, filename }: { base64: string; filename?: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const settings = await getCloudinarySettings();
    if (!settings.cloudName || !settings.apiKey) {
      return {
        success: false,
        message: "Configuration Cloudinary incomplète.",
        publicId: null,
        url: null,
      };
    }
    const apiSecret = await getCloudinaryApiSecret();
    if (!apiSecret) {
      return {
        success: false,
        message: "API Secret Cloudinary manquant.",
        publicId: null,
        url: null,
      };
    }
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: settings.cloudName,
        api_key: settings.apiKey,
        api_secret: apiSecret,
      });
      const root = settings.folder ?? "streammanager";
      let publicId: string;
      if (filename) {
        const withoutExt = filename.replace(/\.[^.]+$/, "");
        const hasSubFolder = withoutExt.includes("/");
        publicId = hasSubFolder
          ? `${root}/${withoutExt}_${Date.now()}`
          : `${root}/uploads/${withoutExt}_${Date.now()}`;
      } else {
        publicId = `${root}/uploads/upload_${Date.now()}`;
      }
      const uploadResult = await cloudinary.uploader.upload(base64, {
        public_id: publicId,
      });
      logger.info(
        { publicId: uploadResult.public_id },
        "Image uploadée sur Cloudinary",
      );
      return {
        success: true,
        message: "Image uploadée avec succès.",
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    } catch (err) {
      logger.error({ err }, "Upload Cloudinary échoué");
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return {
        success: false,
        message: `Échec : ${message}`,
        publicId: null,
        url: null,
      };
    }
  },
  deleteFromCloudinary: async (
    _: unknown,
    { publicId }: { publicId: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const settings = await getCloudinarySettings();
    const apiSecret = await getCloudinaryApiSecret();
    if (!settings.cloudName || !settings.apiKey || !apiSecret) {
      return {
        success: false,
        message: "Configuration Cloudinary incomplète.",
      };
    }
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: settings.cloudName,
        api_key: settings.apiKey,
        api_secret: apiSecret,
      });
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== "ok") {
        return { success: false, message: `Cloudinary: ${result.result}` };
      }
      logger.info({ publicId }, "Image supprimée de Cloudinary");
      return { success: true, message: "Image supprimée avec succès." };
    } catch (err) {
      logger.error({ err }, "Suppression Cloudinary échouée");
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return { success: false, message: `Échec : ${message}` };
    }
  },
  replaceCloudinaryImage: async (
    _: unknown,
    {
      oldPublicId,
      base64,
      filename,
    }: { oldPublicId: string; base64: string; filename?: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const settings = await getCloudinarySettings();
    const apiSecret = await getCloudinaryApiSecret();
    if (!settings.cloudName || !settings.apiKey || !apiSecret) {
      return {
        success: false,
        message: "Configuration Cloudinary incomplète.",
        publicId: null,
        url: null,
      };
    }
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: settings.cloudName,
        api_key: settings.apiKey,
        api_secret: apiSecret,
      });
      const root = settings.folder ?? "streammanager";
      const oldSegments = oldPublicId.split("/");
      const oldSubFolder =
        oldSegments.length >= 3 ? oldSegments.slice(1, -1).join("/") : null;
      const baseName = filename
        ? filename.replace(/\.[^.]+$/, "")
        : `upload_${Date.now()}`;
      const newPublicId = oldSubFolder
        ? `${root}/${oldSubFolder}/${baseName}_${Date.now()}`
        : `${root}/uploads/${baseName}_${Date.now()}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        public_id: newPublicId,
      });
      await cloudinary.uploader.destroy(oldPublicId);
      logger.info(
        { oldPublicId, newPublicId: uploadResult.public_id },
        "Image remplacée sur Cloudinary",
      );
      return {
        success: true,
        message: "Image remplacée avec succès.",
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    } catch (err) {
      logger.error({ err }, "Remplacement Cloudinary échoué");
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return {
        success: false,
        message: `Échec : ${message}`,
        publicId: null,
        url: null,
      };
    }
  },
};

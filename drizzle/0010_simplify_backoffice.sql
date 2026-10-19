ALTER TABLE "auth_api_keys" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_inquiries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_inquiry_replies" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promotions_services" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promotions_promotions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feature_flags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications_settings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_smtp" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_storage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "auth_api_keys" CASCADE;--> statement-breakpoint
DROP TABLE "auth_refresh_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "contact_inquiries" CASCADE;--> statement-breakpoint
DROP TABLE "contact_inquiry_replies" CASCADE;--> statement-breakpoint
DROP TABLE "promotions_services" CASCADE;--> statement-breakpoint
DROP TABLE "promotions_promotions" CASCADE;--> statement-breakpoint
DROP TABLE "feature_flags" CASCADE;--> statement-breakpoint
DROP TABLE "notifications_settings" CASCADE;--> statement-breakpoint
DROP TABLE "settings_smtp" CASCADE;--> statement-breakpoint
DROP TABLE "settings_storage" CASCADE;--> statement-breakpoint
ALTER TABLE "services_plans" DROP CONSTRAINT IF EXISTS "services_plans_service_or_promotion_check";--> statement-breakpoint
ALTER TABLE "services_plans" DROP CONSTRAINT IF EXISTS "services_plans_promotion_id_promotions_promotions_id_fk";
--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "services_plans" DROP COLUMN "promotion_id";--> statement-breakpoint
DROP TYPE "public"."auth_token_purpose";--> statement-breakpoint
DROP TYPE "public"."chat_sender_type";--> statement-breakpoint
DROP TYPE "public"."chat_session_status";--> statement-breakpoint
DROP TYPE "public"."contact_inquiry_status";--> statement-breakpoint
DROP TYPE "public"."storage_provider";
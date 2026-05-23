CREATE TYPE "public"."user_role" AS ENUM('admin', 'accountant', 'user');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'unpaid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('full', 'partial', 'custom', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'paused', 'cancelled');--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"notes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_cloudinary" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"cloud_name" text NOT NULL,
	"api_key" text NOT NULL,
	"api_secret_encrypted" text NOT NULL,
	"upload_preset" text,
	"folder" text DEFAULT 'streammanager',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"message" jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiry_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"inquiry_id" text NOT NULL,
	"body" jsonb NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"subject" text NOT NULL,
	"to_email" text NOT NULL,
	"success" boolean NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"event" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" text DEFAULT 'MAD' NOT NULL,
	"status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duration_months" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency_code" text DEFAULT 'MAD' NOT NULL,
	"plan_type" "plan_type" DEFAULT 'full' NOT NULL,
	"description" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"service_id" text,
	"promotion_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_services" (
	"id" text PRIMARY KEY NOT NULL,
	"promotion_id" text NOT NULL,
	"service_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions_promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_on_homepage" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rich_text_asset_references" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"field_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rich_text_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"url" text NOT NULL,
	"folder" text NOT NULL,
	"content_type" text,
	"original_name" text,
	"size" integer,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "rich_text_assets_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "services_services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'streaming' NOT NULL,
	"description" jsonb,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_on_homepage" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings_smtp" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 587 NOT NULL,
	"secure" boolean DEFAULT false NOT NULL,
	"user" text NOT NULL,
	"password_encrypted" text,
	"sender_email" text NOT NULL,
	"sender_name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaming_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"label" text NOT NULL,
	"email" text,
	"phone" text,
	"supports_profiles" boolean DEFAULT true NOT NULL,
	"max_profiles" integer DEFAULT 1 NOT NULL,
	"notes" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaming_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"profile_index" integer DEFAULT 1 NOT NULL,
	"pin_encrypted" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"account_id" text NOT NULL,
	"profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"notes" jsonb,
	"renewed_from_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summary_links" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"label" text,
	"show_sensitive_info" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "summary_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_inquiry_replies" ADD CONSTRAINT "contact_inquiry_replies_inquiry_id_contact_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."contact_inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_payments" ADD CONSTRAINT "subscriptions_payments_subscription_id_subscriptions_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_services" ADD CONSTRAINT "promotion_services_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_services" ADD CONSTRAINT "promotion_services_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rich_text_asset_references" ADD CONSTRAINT "rich_text_asset_references_public_id_rich_text_assets_public_id_fk" FOREIGN KEY ("public_id") REFERENCES "public"."rich_text_assets"("public_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rich_text_assets" ADD CONSTRAINT "rich_text_assets_uploaded_by_id_auth_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_accounts" ADD CONSTRAINT "streaming_accounts_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profiles" ADD CONSTRAINT "streaming_profiles_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_subscription_id_subscriptions_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_profile_id_streaming_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."streaming_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD CONSTRAINT "subscriptions_subscriptions_client_id_subscriptions_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."subscriptions_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD CONSTRAINT "subscriptions_subscriptions_plan_id_services_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."services_plans"("id") ON DELETE restrict ON UPDATE no action;
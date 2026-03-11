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
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" text DEFAULT 'MAD' NOT NULL,
	"status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"notes" text,
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
	"description" text,
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
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services_services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'streaming' NOT NULL,
	"description" text,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"notes" text,
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
ALTER TABLE "payments_payments" ADD CONSTRAINT "payments_payments_subscription_id_subscriptions_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_services" ADD CONSTRAINT "promotion_services_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_services" ADD CONSTRAINT "promotion_services_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD CONSTRAINT "subscriptions_subscriptions_client_id_subscriptions_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."subscriptions_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD CONSTRAINT "subscriptions_subscriptions_plan_id_services_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."services_plans"("id") ON DELETE restrict ON UPDATE no action;
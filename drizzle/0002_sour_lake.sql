CREATE TABLE "streaming_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"label" text NOT NULL,
	"email" text,
	"password" text,
	"max_profiles" integer DEFAULT 1 NOT NULL,
	"notes" text,
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
ALTER TABLE "streaming_accounts" ADD CONSTRAINT "streaming_accounts_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profiles" ADD CONSTRAINT "streaming_profiles_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_subscription_id_subscriptions_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_profiles" ADD CONSTRAINT "subscription_profiles_profile_id_streaming_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."streaming_profiles"("id") ON DELETE set null ON UPDATE no action;
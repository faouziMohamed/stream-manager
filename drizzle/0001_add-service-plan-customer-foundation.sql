CREATE TYPE "public"."plan_type" AS ENUM('individual', 'shared', 'family');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('video', 'music', 'gaming', 'other');--> statement-breakpoint
CREATE TABLE "customers_customers" (
	"business_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar(255),
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"notes_content" jsonb,
	"phone" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_customers_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "services_plans" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency_code" varchar(8) DEFAULT 'MAD' NOT NULL,
	"duration_months" integer NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan_type" "plan_type" DEFAULT 'individual' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"promotion_id" varchar(64),
	"service_id" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_plans_service_or_promotion_check" CHECK ((("service_id" is null) <> ("promotion_id" is null)))
);
--> statement-breakpoint
CREATE TABLE "services_services" (
	"category" "service_category" DEFAULT 'video' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"description_content" jsonb,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"image_key" varchar(512),
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"supports_profiles" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE restrict ON UPDATE no action;
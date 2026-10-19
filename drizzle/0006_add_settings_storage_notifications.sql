DO $$ BEGIN
  CREATE TYPE "public"."storage_provider" AS ENUM('cloudinary', 's3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
  "key" varchar(128) PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "description" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications_events" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "event" varchar(128) NOT NULL,
  "recipient" varchar(255) NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" "notification_status" NOT NULL,
  "error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications_settings" (
  "event" varchar(128) PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings_app" (
  "key" varchar(128) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings_smtp" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "host" varchar(255) NOT NULL,
  "port" integer NOT NULL,
  "secure" boolean DEFAULT false NOT NULL,
  "user" varchar(255) NOT NULL,
  "password_encrypted" varchar(1024) NOT NULL,
  "from_address" varchar(255) NOT NULL,
  "from_name" varchar(255) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings_storage" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "provider" "storage_provider" NOT NULL,
  "cloud_name" varchar(255),
  "cloudinary_api_key" varchar(255),
  "cloudinary_api_secret_encrypted" varchar(1024),
  "cloudinary_folder" varchar(255),
  "cloudinary_upload_preset" varchar(255),
  "s3_endpoint" varchar(1024),
  "s3_region" varchar(255),
  "s3_bucket" varchar(255),
  "s3_access_key_id" varchar(255),
  "s3_secret_access_key_encrypted" varchar(1024),
  "s3_public_url_base" varchar(1024),
  "s3_force_path_style" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings_summary_links" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "token" varchar(255) NOT NULL,
  "label" varchar(255),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "settings_summary_links_token_unique" UNIQUE("token")
);

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

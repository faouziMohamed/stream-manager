CREATE TYPE "public"."auth_token_purpose" AS ENUM('refresh');--> statement-breakpoint
CREATE TYPE "public"."auth_user_role" AS ENUM('admin', 'accountant', 'user');--> statement-breakpoint
CREATE TABLE "auth_api_keys" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"last_used_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"prefix" varchar(32) NOT NULL,
	"revoked_at" timestamp with time zone,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"user_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_refresh_tokens" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_info" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"purpose" "auth_token_purpose" DEFAULT 'refresh' NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"token" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"browser" varchar(128),
	"country_code" varchar(8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_type" varchar(64),
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ip_hash" varchar(255),
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"os" varchar(128),
	"revoked_at" timestamp with time zone,
	"revoked_reason" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"avatar" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar(255) NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" "auth_user_role" DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auth_api_keys" ADD CONSTRAINT "auth_api_keys_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_session_id_auth_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;
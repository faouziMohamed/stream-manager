CREATE TABLE "streaming_accounts" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar(255),
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"label" varchar(255) NOT NULL,
	"max_profiles" integer DEFAULT 1 NOT NULL,
	"password_encrypted" varchar(512),
	"service_id" varchar(64) NOT NULL,
	"supports_profiles" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaming_profile_assignments" (
	"account_id" varchar(64) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"membership_id" varchar(64) NOT NULL,
	"profile_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "streaming_profiles" (
	"account_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_assigned" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"pin_encrypted" varchar(512),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streaming_accounts" ADD CONSTRAINT "streaming_accounts_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profile_assignments" ADD CONSTRAINT "streaming_profile_assignments_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profile_assignments" ADD CONSTRAINT "streaming_profile_assignments_membership_id_memberships_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profile_assignments" ADD CONSTRAINT "streaming_profile_assignments_profile_id_streaming_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."streaming_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_profiles" ADD CONSTRAINT "streaming_profiles_account_id_streaming_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."streaming_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "streaming_accounts_service_id_idx" ON "streaming_accounts" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "assignments_account_id_idx" ON "streaming_profile_assignments" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "assignments_membership_id_idx" ON "streaming_profile_assignments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "assignments_profile_id_idx" ON "streaming_profile_assignments" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "streaming_profiles_account_id_idx" ON "streaming_profiles" USING btree ("account_id");
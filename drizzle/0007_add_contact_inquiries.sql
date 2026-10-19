DO $$ BEGIN
  CREATE TYPE "public"."contact_inquiry_status" AS ENUM('new', 'replied', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_inquiries" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "status" "contact_inquiry_status" DEFAULT 'new' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_inquiry_replies" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "inquiry_id" varchar(64) NOT NULL,
  "admin_id" varchar(64) NOT NULL,
  "content" text NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contact_inquiry_replies" ADD CONSTRAINT "contact_inquiry_replies_inquiry_id_contact_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."contact_inquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contact_inquiry_replies" ADD CONSTRAINT "contact_inquiry_replies_admin_id_auth_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "media_assets" (
	"content_type" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"original_filename" varchar(512) NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"uploaded_by_user_id" varchar(64) NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_auth_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;

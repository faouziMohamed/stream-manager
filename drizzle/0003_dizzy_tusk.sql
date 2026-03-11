ALTER TABLE "streaming_accounts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "streaming_profiles" ADD COLUMN "pin_encrypted" text;--> statement-breakpoint
ALTER TABLE "streaming_accounts" DROP COLUMN "password";
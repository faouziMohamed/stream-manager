CREATE TYPE "public"."chat_sender_type" AS ENUM('guest', 'admin');--> statement-breakpoint
CREATE TYPE "public"."chat_session_status" AS ENUM('open', 'closed', 'resolved');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"emailed_at" timestamp with time zone,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"sender_id" varchar(64),
	"sender_type" "chat_sender_type" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"business_id" varchar(32) NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guest_email" varchar(255),
	"guest_name" varchar(255) NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"membership_ref" varchar(32),
	"session_token" varchar(512) NOT NULL,
	"socket_room_id" varchar(64) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "chat_session_status" DEFAULT 'open' NOT NULL,
	CONSTRAINT "chat_sessions_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sent_at_idx" ON "chat_messages" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "chat_sessions_token_idx" ON "chat_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "chat_sessions_status_idx" ON "chat_sessions" USING btree ("status");
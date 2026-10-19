CREATE TABLE "audit_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"actor_id" varchar(64),
	"actor_email" varchar(255),
	"actor_role" varchar(32),
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(64),
	"entity_id" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_auth_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");
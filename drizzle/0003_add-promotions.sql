CREATE TABLE "promotions_services" (
	"promotion_id" varchar(64) NOT NULL,
	"service_id" varchar(64) NOT NULL,
	CONSTRAINT "promotions_services_pk" PRIMARY KEY("promotion_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "promotions_promotions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description_content" jsonb,
	"end_date" date,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promotions_services" ADD CONSTRAINT "promotions_services_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions_services" ADD CONSTRAINT "promotions_services_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promotions_services_service_id_idx" ON "promotions_services" USING btree ("service_id");--> statement-breakpoint
ALTER TABLE "services_plans" ADD CONSTRAINT "services_plans_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE restrict ON UPDATE no action;
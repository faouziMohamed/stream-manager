CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
ALTER TABLE "promotion_services" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "promotion_services" CASCADE;--> statement-breakpoint
ALTER TABLE "services_plans" DROP CONSTRAINT "services_plans_promotion_id_promotions_promotions_id_fk";
--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "plan_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "plan_type" SET DEFAULT 'full'::text;--> statement-breakpoint
DROP TYPE "public"."plan_type";--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('full', 'partial', 'custom');--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "plan_type" SET DEFAULT 'full'::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "plan_type" SET DATA TYPE "public"."plan_type" USING "plan_type"::"public"."plan_type";--> statement-breakpoint
ALTER TABLE "services_plans" ALTER COLUMN "service_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD COLUMN "service_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD COLUMN "discount_type" "discount_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD COLUMN "discount_value" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD COLUMN "promotion_id" text;--> statement-breakpoint
ALTER TABLE "promotions_promotions" ADD CONSTRAINT "promotions_promotions_service_id_services_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_subscriptions" ADD CONSTRAINT "subscriptions_subscriptions_promotion_id_promotions_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions_promotions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services_plans" DROP COLUMN "promotion_id";
CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'cancelled', 'pending');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TABLE "memberships_memberships" (
	"business_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"end_date" date NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"plan_id" varchar(64) NOT NULL,
	"renewed_from_id" varchar(64),
	"start_date" date NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_memberships_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "memberships_payments" (
	"amount" numeric(12, 2) NOT NULL,
	"business_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency_code" varchar(8) DEFAULT 'MAD' NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"due_date" date NOT NULL,
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"membership_id" varchar(64) NOT NULL,
	"method" "payment_method",
	"notes" text,
	"paid_date" date,
	"status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_payments_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
ALTER TABLE "memberships_memberships" ADD CONSTRAINT "memberships_memberships_customer_id_customers_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships_memberships" ADD CONSTRAINT "memberships_memberships_plan_id_services_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."services_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships_memberships" ADD CONSTRAINT "memberships_memberships_renewed_from_id_memberships_memberships_id_fk" FOREIGN KEY ("renewed_from_id") REFERENCES "public"."memberships_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships_payments" ADD CONSTRAINT "memberships_payments_customer_id_customers_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships_payments" ADD CONSTRAINT "memberships_payments_membership_id_memberships_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_customer_id_idx" ON "memberships_memberships" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "memberships_plan_id_idx" ON "memberships_memberships" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "memberships_renewed_from_id_idx" ON "memberships_memberships" USING btree ("renewed_from_id");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships_memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_customer_id_idx" ON "memberships_payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payments_due_date_idx" ON "memberships_payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payments_membership_id_idx" ON "memberships_payments" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "memberships_payments" USING btree ("status");
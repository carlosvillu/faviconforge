ALTER TABLE "users" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "premium_since" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;
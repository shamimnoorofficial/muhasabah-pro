CREATE TABLE "pro_cashback" (
	"user_id" text,
	"step" integer,
	"amount_cents" integer NOT NULL,
	"refund_id" text NOT NULL,
	"streak" integer NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "pro_cashback_pkey" PRIMARY KEY("user_id","step")
);
--> statement-breakpoint
CREATE TABLE "pro_members" (
	"user_id" text PRIMARY KEY,
	"email" text DEFAULT '' NOT NULL,
	"stripe_customer_id" text,
	"lifetime_payment_intent" text,
	"lifetime_purchased_at" bigint,
	"subscription_id" text,
	"subscription_status" text,
	"subscription_period_end" bigint,
	"subscription_auto_renew" boolean DEFAULT true NOT NULL,
	"synced_at" bigint,
	"created_at" bigint NOT NULL
);

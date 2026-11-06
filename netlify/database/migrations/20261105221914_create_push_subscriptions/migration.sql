CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"hour" integer DEFAULT 21 NOT NULL,
	"lang" text DEFAULT 'en' NOT NULL,
	"last_sent_day" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);

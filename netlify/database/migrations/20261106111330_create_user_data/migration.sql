CREATE TABLE "user_data" (
	"user_id" text PRIMARY KEY,
	"data" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"device" text,
	"size" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL
);

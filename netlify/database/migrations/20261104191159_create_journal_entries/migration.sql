CREATE TABLE "journal_entries" (
	"owner" text,
	"day" text,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "journal_entries_pkey" PRIMARY KEY("owner","day")
);

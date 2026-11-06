CREATE TABLE "app_preferences" (
	"owner" text PRIMARY KEY,
	"language" text DEFAULT 'en' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL
);

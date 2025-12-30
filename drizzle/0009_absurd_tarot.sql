CREATE TYPE "public"."podcast_language" AS ENUM('es', 'en');--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "language" "podcast_language" DEFAULT 'es' NOT NULL;
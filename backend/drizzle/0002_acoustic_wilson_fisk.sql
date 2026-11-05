ALTER TABLE "users" DROP CONSTRAINT "users_phone_e164_check";--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD COLUMN "invalidated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "previous_refresh_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_e164_check" CHECK ("users"."phone" ~ '^[+][1-9][0-9]{7,14}$');
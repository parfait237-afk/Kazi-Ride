DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_attempts_range_check" CHECK ("otp_challenges"."attempts" >= 0 AND "otp_challenges"."attempts" <= 5);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_e164_check" CHECK ("users"."phone" ~ '^[+][1-9][0-9]{7,14}$');

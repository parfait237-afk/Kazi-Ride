DO $$ BEGIN
  CREATE TYPE "public"."saved_place_type" AS ENUM('HOME', 'WORK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_saved_places" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "type" "saved_place_type" NOT NULL,
  "label" text NOT NULL,
  "address" text NOT NULL,
  "place_id" text,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_places_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
  CONSTRAINT "saved_places_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_saved_places" ADD CONSTRAINT "user_saved_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saved_places_user_type_unique" ON "user_saved_places" USING btree ("user_id","type");
CREATE INDEX IF NOT EXISTS "saved_places_user_idx" ON "user_saved_places" USING btree ("user_id");

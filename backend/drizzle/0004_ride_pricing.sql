DO $$ BEGIN CREATE TYPE "public"."vehicle_category_code" AS ENUM('ECO', 'COMFORT', 'VAN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."ride_estimate_status" AS ENUM('ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "code" "vehicle_category_code" NOT NULL, "name" text NOT NULL, "description" text NOT NULL,
  "min_passengers" integer DEFAULT 1 NOT NULL, "max_passengers" integer NOT NULL, "image_key" text, "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "vehicle_categories_passengers_check" CHECK ("min_passengers" > 0 AND "max_passengers" >= "min_passengers")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_categories_code_unique" ON "vehicle_categories" ("code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "category_id" uuid NOT NULL REFERENCES "vehicle_categories"("id"), "country_code" text NOT NULL, "city_code" text,
  "currency" text DEFAULT 'XAF' NOT NULL, "base_fare" numeric(14,3) NOT NULL, "price_per_km" numeric(14,3) NOT NULL, "price_per_minute" numeric(14,3) NOT NULL,
  "minimum_fare" numeric(14,3) NOT NULL, "service_fee" numeric(14,3) DEFAULT '0' NOT NULL, "demand_multiplier" numeric(8,3) DEFAULT '1' NOT NULL,
  "rounding_step" numeric(14,3) DEFAULT '50' NOT NULL, "version" integer DEFAULT 1 NOT NULL, "is_active" boolean DEFAULT true NOT NULL,
  "effective_from" timestamp with time zone DEFAULT now() NOT NULL, "effective_until" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pricing_rules_positive_check" CHECK ("base_fare" >= 0 AND "price_per_km" >= 0 AND "price_per_minute" >= 0 AND "minimum_fare" >= 0 AND "service_fee" >= 0 AND "demand_multiplier" > 0 AND "rounding_step" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_rules_lookup_idx" ON "pricing_rules" ("country_code", "city_code", "category_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_rules_version_unique" ON "pricing_rules" ("category_id", "country_code", "city_code", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_rules_single_open_active_unique" ON "pricing_rules" ("category_id", "country_code", "city_code") WHERE "is_active" = true AND "effective_until" IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ride_estimates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "pickup_latitude" double precision NOT NULL, "pickup_longitude" double precision NOT NULL, "destination_latitude" double precision NOT NULL, "destination_longitude" double precision NOT NULL,
  "distance_meters" integer NOT NULL, "duration_seconds" integer NOT NULL, "country_code" text NOT NULL, "city_code" text NOT NULL, "currency" text NOT NULL,
  "quotes" jsonb NOT NULL, "status" "ride_estimate_status" DEFAULT 'ACTIVE' NOT NULL, "expires_at" timestamp with time zone NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ride_estimates_user_idx" ON "ride_estimates" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "ride_estimates_expires_idx" ON "ride_estimates" ("expires_at");
--> statement-breakpoint
INSERT INTO "vehicle_categories" ("code", "name", "description", "min_passengers", "max_passengers", "image_key") VALUES
 ('ECO', 'Eco', 'Économique et pratique', 1, 4, 'vehicle-yaris'),
 ('COMFORT', 'Comfort', 'Confort et climatisation', 1, 4, 'vehicle-corolla'),
 ('VAN', 'Van', 'Idéal pour les groupes', 5, 7, 'vehicle-hiace')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "pricing_rules" ("category_id", "country_code", "city_code", "base_fare", "price_per_km", "price_per_minute", "minimum_fare", "service_fee", "demand_multiplier", "rounding_step", "version")
SELECT vc.id, 'CM', city.code, rates.base_fare, rates.price_km, rates.price_minute, rates.minimum_fare, 0, 1, 50, 1
FROM "vehicle_categories" vc
CROSS JOIN (VALUES ('DLA'), ('YAO'), ('BFX')) city(code)
JOIN (VALUES
 ('ECO'::vehicle_category_code, 500, 150, 20, 1000),
 ('COMFORT'::vehicle_category_code, 800, 220, 30, 1500),
 ('VAN'::vehicle_category_code, 1200, 350, 40, 2500)
) rates(code, base_fare, price_km, price_minute, minimum_fare) ON rates.code = vc.code
ON CONFLICT ("category_id", "country_code", "city_code", "version") DO NOTHING;

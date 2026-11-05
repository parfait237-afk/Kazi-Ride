CREATE UNIQUE INDEX IF NOT EXISTS "pricing_rules_single_open_active_unique" ON "pricing_rules" ("category_id", "country_code", "city_code") WHERE "is_active" = true AND "effective_until" IS NULL;

import { relations, sql } from 'drizzle-orm';
import { boolean, check, doublePrecision, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['PASSENGER']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  role: userRole('role').notNull().default('PASSENGER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
  uniqueIndex('users_phone_unique').on(table.phone),
  check('users_phone_e164_check', sql`${table.phone} ~ '^[+][1-9][0-9]{7,14}$'`),
]);

export const otpChallenges = pgTable('otp_challenges', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('otp_email_created_idx').on(table.email, table.createdAt),
  index('otp_phone_created_idx').on(table.phone, table.createdAt),
  index('otp_expires_idx').on(table.expiresAt),
  check('otp_attempts_range_check', sql`${table.attempts} >= 0 AND ${table.attempts} <= 5`),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  previousRefreshTokenHash: text('previous_refresh_token_hash'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('sessions_refresh_hash_unique').on(table.refreshTokenHash),
  index('sessions_user_idx').on(table.userId),
  index('sessions_expires_idx').on(table.expiresAt),
]);

export const savedPlaceType = pgEnum('saved_place_type', ['HOME', 'WORK']);
export const vehicleCategoryCode = pgEnum('vehicle_category_code', ['ECO', 'COMFORT', 'VAN']);
export const rideEstimateStatus = pgEnum('ride_estimate_status', ['ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED']);

export const userSavedPlaces = pgTable('user_saved_places', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: savedPlaceType('type').notNull(),
  label: text('label').notNull(),
  address: text('address').notNull(),
  placeId: text('place_id'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('saved_places_user_type_unique').on(table.userId, table.type),
  index('saved_places_user_idx').on(table.userId),
  check('saved_places_latitude_check', sql`${table.latitude} >= -90 AND ${table.latitude} <= 90`),
  check('saved_places_longitude_check', sql`${table.longitude} >= -180 AND ${table.longitude} <= 180`),
]);

export const vehicleCategories = pgTable('vehicle_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: vehicleCategoryCode('code').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  minPassengers: integer('min_passengers').notNull().default(1),
  maxPassengers: integer('max_passengers').notNull(),
  imageKey: text('image_key'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('vehicle_categories_code_unique').on(table.code),
  check('vehicle_categories_passengers_check', sql`${table.minPassengers} > 0 AND ${table.maxPassengers} >= ${table.minPassengers}`),
]);

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => vehicleCategories.id),
  countryCode: text('country_code').notNull(),
  cityCode: text('city_code'),
  currency: text('currency').notNull().default('XAF'),
  baseFare: numeric('base_fare', { precision: 14, scale: 3 }).notNull(),
  pricePerKm: numeric('price_per_km', { precision: 14, scale: 3 }).notNull(),
  pricePerMinute: numeric('price_per_minute', { precision: 14, scale: 3 }).notNull(),
  minimumFare: numeric('minimum_fare', { precision: 14, scale: 3 }).notNull(),
  serviceFee: numeric('service_fee', { precision: 14, scale: 3 }).notNull().default('0'),
  demandMultiplier: numeric('demand_multiplier', { precision: 8, scale: 3 }).notNull().default('1'),
  roundingStep: numeric('rounding_step', { precision: 14, scale: 3 }).notNull().default('50'),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('pricing_rules_lookup_idx').on(table.countryCode, table.cityCode, table.categoryId, table.isActive),
  uniqueIndex('pricing_rules_version_unique').on(table.categoryId, table.countryCode, table.cityCode, table.version),
  check('pricing_rules_positive_check', sql`${table.baseFare} >= 0 AND ${table.pricePerKm} >= 0 AND ${table.pricePerMinute} >= 0 AND ${table.minimumFare} >= 0 AND ${table.serviceFee} >= 0 AND ${table.demandMultiplier} > 0 AND ${table.roundingStep} > 0`),
]);

export const rideEstimates = pgTable('ride_estimates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pickupLatitude: doublePrecision('pickup_latitude').notNull(),
  pickupLongitude: doublePrecision('pickup_longitude').notNull(),
  destinationLatitude: doublePrecision('destination_latitude').notNull(),
  destinationLongitude: doublePrecision('destination_longitude').notNull(),
  distanceMeters: integer('distance_meters').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  countryCode: text('country_code').notNull(),
  cityCode: text('city_code').notNull(),
  currency: text('currency').notNull(),
  quotes: jsonb('quotes').$type<Array<{ categoryId: string; code: 'ECO' | 'COMFORT' | 'VAN'; price: number; pricingRuleId: string; pricingRuleVersion: number }>>().notNull(),
  status: rideEstimateStatus('status').notNull().default('ACTIVE'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('ride_estimates_user_idx').on(table.userId, table.createdAt),
  index('ride_estimates_expires_idx').on(table.expiresAt),
]);

export const usersRelations = relations(users, ({ many }) => ({ sessions: many(sessions), savedPlaces: many(userSavedPlaces) }));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const savedPlacesRelations = relations(userSavedPlaces, ({ one }) => ({
  user: one(users, { fields: [userSavedPlaces.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;

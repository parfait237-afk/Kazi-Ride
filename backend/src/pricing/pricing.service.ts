import { and, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { pricingRules, rideEstimates, vehicleCategories } from '../db/schema.js';
import { ApiError } from '../errors.js';
import { getDrivingRoute } from '../routing/routing.service.js';
import type { Coordinate, PriceQuote } from './pricing.types.js';

const ZONES = [
  { code: 'DLA', name: 'Douala', latitude: 4.0511, longitude: 9.7679, radiusKm: 45 },
  { code: 'YAO', name: 'Yaoundé', latitude: 3.848, longitude: 11.5021, radiusKm: 45 },
  { code: 'BFX', name: 'Bafoussam', latitude: 5.4781, longitude: 10.4175, radiusKm: 35 },
] as const;
const SCALE = 1000n;
const toScaled = (value: string) => { const [whole = '0', fraction = ''] = value.split('.'); return BigInt(whole) * SCALE + BigInt((fraction + '000').slice(0, 3)); };
const distanceKm = (a: Coordinate, b: Coordinate) => { const rad = Math.PI / 180; const dLat = (b.latitude - a.latitude) * rad; const dLon = (b.longitude - a.longitude) * rad; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
function resolveZone(pickup: Coordinate, destination: Coordinate) {
  const start = ZONES.find((zone) => distanceKm(pickup, zone) <= zone.radiusKm);
  const end = ZONES.find((zone) => distanceKm(destination, zone) <= zone.radiusKm);
  if (!start || !end || start.code !== end.code) throw new ApiError(422, 'PRICING_ZONE_UNAVAILABLE', 'Ce trajet ne dispose pas encore d’une configuration tarifaire KaziRide.');
  return start;
}
function calculatePrice(rule: typeof pricingRules.$inferSelect, meters: number, seconds: number) {
  const base = toScaled(rule.baseFare); const perKm = toScaled(rule.pricePerKm); const perMinute = toScaled(rule.pricePerMinute);
  const raw = base + BigInt(Math.round(meters)) * perKm / 1000n + BigInt(Math.round(seconds)) * perMinute / 60n;
  const adjusted = raw * toScaled(rule.demandMultiplier) / SCALE + toScaled(rule.serviceFee);
  const minimum = toScaled(rule.minimumFare); const amount = adjusted > minimum ? adjusted : minimum; const step = toScaled(rule.roundingStep);
  return Number(((amount + step / 2n) / step * step) / SCALE);
}
export async function createRideEstimate(userId: string, pickup: Coordinate, destination: Coordinate) {
  const zone = resolveZone(pickup, destination); const route = await getDrivingRoute(pickup, destination); const now = new Date();
  const rows = await db.select({ category: vehicleCategories, rule: pricingRules }).from(vehicleCategories).innerJoin(pricingRules, eq(pricingRules.categoryId, vehicleCategories.id)).where(and(
    eq(vehicleCategories.isActive, true), eq(pricingRules.isActive, true), eq(pricingRules.countryCode, 'CM'), eq(pricingRules.cityCode, zone.code), lte(pricingRules.effectiveFrom, now), or(isNull(pricingRules.effectiveUntil), gt(pricingRules.effectiveUntil, now)),
  )).orderBy(desc(pricingRules.version));
  if (!rows.length) throw new ApiError(422, 'PRICING_NOT_CONFIGURED', `Aucun tarif actif n’est configuré pour ${zone.name}.`);
  const latestRows = [...new Map(rows.map((row) => [row.category.code, row])).values()];
  const quotes: PriceQuote[] = latestRows.map(({ category, rule }) => ({ categoryId: category.id, code: category.code, name: category.name, description: category.description, minPassengers: category.minPassengers, maxPassengers: category.maxPassengers, imageKey: category.imageKey, price: calculatePrice(rule, route.distanceMeters, route.durationSeconds), available: true, driverEtaMinutes: null, pricingRuleId: rule.id, pricingRuleVersion: rule.version }));
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const snapshot = quotes.map(({ categoryId, code, price, pricingRuleId, pricingRuleVersion }) => ({ categoryId, code, price, pricingRuleId, pricingRuleVersion }));
  const [estimate] = await db.insert(rideEstimates).values({ userId, pickupLatitude: pickup.latitude, pickupLongitude: pickup.longitude, destinationLatitude: destination.latitude, destinationLongitude: destination.longitude, distanceMeters: Math.round(route.distanceMeters), durationSeconds: Math.round(route.durationSeconds), countryCode: 'CM', cityCode: zone.code, currency: 'XAF', quotes: snapshot, expiresAt }).returning({ id: rideEstimates.id });
  if (!estimate) throw new ApiError(500, 'ESTIMATE_CREATE_FAILED', 'Le devis n’a pas pu être créé.');
  return { estimateId: estimate.id, currency: 'XAF' as const, city: zone.name, distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds, routeCoordinates: route.coordinates, expiresAt: expiresAt.toISOString(), categories: quotes.map(({ pricingRuleId: _id, pricingRuleVersion: _version, categoryId: _categoryId, ...quote }) => ({ ...quote, tripDurationMinutes: Math.max(1, Math.round(route.durationSeconds / 60)) })) };
}
export async function validateRideEstimate(userId: string, estimateId: string, categoryCode: 'ECO' | 'COMFORT' | 'VAN') {
  const [estimate] = await db.select().from(rideEstimates).where(and(eq(rideEstimates.id, estimateId), eq(rideEstimates.userId, userId))).limit(1);
  if (!estimate) throw new ApiError(404, 'ESTIMATE_NOT_FOUND', 'Ce devis est introuvable.');
  if (estimate.status !== 'ACTIVE' || estimate.expiresAt <= new Date()) throw new ApiError(410, 'ESTIMATE_EXPIRED', 'Ce devis a expiré. Veuillez recalculer le trajet.');
  const quote = estimate.quotes.find((item) => item.code === categoryCode);
  if (!quote) throw new ApiError(422, 'CATEGORY_UNAVAILABLE', 'Cette catégorie n’est pas disponible pour ce devis.');
  return { estimate, quote };
}

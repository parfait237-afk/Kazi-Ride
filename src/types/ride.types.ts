import type { RouteCoordinate } from './route.types';
export type VehicleCategoryCode = 'ECO' | 'COMFORT' | 'VAN';
export type RideCategoryQuote = { code: VehicleCategoryCode; name: string; description: string; minPassengers: number; maxPassengers: number; imageKey: string | null; price: number; available: boolean; driverEtaMinutes: number | null; tripDurationMinutes: number };
export type RideEstimate = { estimateId: string; currency: 'XAF'; city: string; distanceMeters: number; durationSeconds: number; routeCoordinates: RouteCoordinate[]; expiresAt: string; categories: RideCategoryQuote[] };

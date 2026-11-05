export type Coordinate = { latitude: number; longitude: number };
export type CategoryCode = 'ECO' | 'COMFORT' | 'VAN';
export type PriceQuote = { categoryId: string; code: CategoryCode; name: string; description: string; minPassengers: number; maxPassengers: number; imageKey: string | null; price: number; available: boolean; driverEtaMinutes: null; pricingRuleId: string; pricingRuleVersion: number };

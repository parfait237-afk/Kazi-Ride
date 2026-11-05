export type RouteCoordinate = { latitude: number; longitude: number };
export type DrivingRoute = { distanceMeters: number; durationSeconds: number; coordinates: RouteCoordinate[] };

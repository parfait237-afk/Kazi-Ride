import { apiRequest } from './api';
import type { DrivingRoute, RouteCoordinate } from '@/types/route.types';

export async function getDrivingRoute(origin: RouteCoordinate, destination: RouteCoordinate) {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
  });
  const response = await apiRequest<{ route: DrivingRoute }>(`/api/routes?${params.toString()}`);
  return response.route;
}

import { apiRequest } from './api';
import type { RouteCoordinate } from '@/types/route.types';
import type { RideEstimate, VehicleCategoryCode } from '@/types/ride.types';
export const rideEstimateService = {
  create(pickup: RouteCoordinate, destination: RouteCoordinate) {
    return apiRequest<RideEstimate>('/api/rides/estimate', { method: 'POST', body: JSON.stringify({ pickup, destination }) });
  },
  confirm(estimateId: string, categoryCode: VehicleCategoryCode) {
    return apiRequest<{ rideId: string; status: string }>('/api/rides/confirm', { method: 'POST', body: JSON.stringify({ estimateId, categoryCode }) });
  },
};

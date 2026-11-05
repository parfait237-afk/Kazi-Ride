import { useCallback, useEffect, useState } from 'react';
import { rideEstimateService } from '@/services/ride-estimate.service';
import type { RouteCoordinate } from '@/types/route.types';
import type { RideEstimate } from '@/types/ride.types';
export function useRideEstimate(pickup: RouteCoordinate, destination: RouteCoordinate) {
  const [estimate, setEstimate] = useState<RideEstimate | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setEstimate(await rideEstimateService.create(pickup, destination)); } catch (requestError) { setEstimate(null); setError(requestError instanceof Error ? requestError.message : 'Le devis est indisponible.'); } finally { setLoading(false); } }, [pickup.latitude, pickup.longitude, destination.latitude, destination.longitude]);
  useEffect(() => { void load(); }, [load]);
  return { estimate, loading, error, retry: load };
}

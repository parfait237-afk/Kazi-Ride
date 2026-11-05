import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import { getDrivingRoute } from './routing.service.js';

describe('getDrivingRoute', () => {
  afterEach(() => { vi.unstubAllGlobals(); env.OSRM_BASE_URL = undefined; });

  it('retourne la distance, la durée et convertit GeoJSON en coordonnées mobiles', async () => {
    env.OSRM_BASE_URL = 'https://osrm.test';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'Ok', routes: [{ distance: 12500, duration: 1500, geometry: { type: 'LineString', coordinates: [[9.7, 4.05], [9.75, 4.08]] } }] }),
    }));
    const route = await getDrivingRoute({ latitude: 4.05, longitude: 9.7 }, { latitude: 4.08, longitude: 9.75 });
    expect(route.distanceMeters).toBe(12500);
    expect(route.durationSeconds).toBe(1500);
    expect(route.coordinates).toEqual([{ latitude: 4.05, longitude: 9.7 }, { latitude: 4.08, longitude: 9.75 }]);
  });

  it('refuse de prétendre calculer un itinéraire sans serveur OSRM configuré', async () => {
    await expect(getDrivingRoute({ latitude: 4.05, longitude: 9.7 }, { latitude: 4.08, longitude: 9.75 }))
      .rejects.toMatchObject({ code: 'ROUTING_NOT_CONFIGURED', status: 503 });
  });
});

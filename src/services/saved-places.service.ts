import { apiRequest } from './api';
import type { Place, SavedPlace, SavedPlaceType } from '@/types/place.types';

export const savedPlacesService = {
  async list() {
    const response = await apiRequest<{ places: Array<Omit<SavedPlace, 'name'> & { label: string }> }>('/api/users/me/saved-places');
    return response.places.map(({ label, ...place }) => ({ ...place, name: label }));
  },
  async save(type: SavedPlaceType, place: Place) {
    const response = await apiRequest<{ place: Omit<SavedPlace, 'name'> & { label: string } }>(`/api/users/me/saved-places/${type}`, {
      method: 'PUT',
      body: JSON.stringify({ label: place.name, address: place.address, placeId: place.placeId, latitude: place.latitude, longitude: place.longitude }),
    });
    const { label, ...saved } = response.place;
    return { ...saved, name: label };
  },
  remove(type: SavedPlaceType) {
    return apiRequest<void>(`/api/users/me/saved-places/${type}`, { method: 'DELETE' });
  },
};

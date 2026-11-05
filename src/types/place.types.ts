export type Place = {
  placeId?: string | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
};

export type PlaceSuggestion = { placeId: string; name: string; address: string };

export type SavedPlaceType = 'HOME' | 'WORK';
export type SavedPlace = Place & { id: string; type: SavedPlaceType };

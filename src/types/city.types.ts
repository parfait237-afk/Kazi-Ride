export type CityBounds = { north: number; south: number; east: number; west: number };

export type CurrentCity = {
  name: string;
  country: string;
  countryCode: string;
  center: { latitude: number; longitude: number };
  bounds?: CityBounds;
  placeId?: string;
  address?: string;
};

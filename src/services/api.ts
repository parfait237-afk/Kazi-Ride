import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (Platform.OS === 'web') return '';

  // Expo Go fournit l'hôte réellement utilisé par le téléphone, en LAN comme
  // avec un tunnel. Les routes API Expo relaient ensuite vers Express :4000.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (!hostUri) return '';
  const protocol = hostUri.includes('.expo.app') ? 'https' : 'http';
  return `${protocol}://${hostUri}`;
}

const API_URL = resolveApiUrl();
let accessToken: string | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    throw new ApiClientError(0, timedOut ? 'API_TIMEOUT' : 'NETWORK_ERROR', timedOut
      ? 'Le serveur met trop de temps à répondre.'
      : 'Le serveur KaziRide est inaccessible.');
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 204) return undefined as T;
  const raw = await response.text();
  let data: any;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { throw new ApiClientError(response.status, 'INVALID_API_RESPONSE', 'Le serveur KaziRide a retourné une réponse invalide. Redémarrez Expo et le backend.'); }
  if (!response.ok) {
    throw new ApiClientError(response.status, data?.error?.code ?? 'API_ERROR', data?.error?.message ?? 'Erreur API');
  }
  return data as T;
}

import { clearSession, getToken, notifyUnauthorized } from './authStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4010';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && options.auth) {
    // Clear storage here (synchronous, immediate) and let the auth layer
    // react to the event for the React-state side of logging out — this
    // module has no router/context access and shouldn't force a full-page
    // reload for what the SPA can handle as a normal state change.
    clearSession();
    notifyUnauthorized();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Request failed');
  }

  return data as T;
}

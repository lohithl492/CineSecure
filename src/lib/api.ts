import { APP_CONFIG, API_ROUTES, STORAGE_KEYS } from '@/constants/config';
import type { ApiError } from '@/types';

/** A thin API wrapper around Supabase that mirrors the REST contract documented in API_ROUTES. */
export class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  setTokens(access: string | null, refresh: string | null) {
    if (access) localStorage.setItem(STORAGE_KEYS.accessToken, access);
    else localStorage.removeItem(STORAGE_KEYS.accessToken);
    if (refresh) localStorage.setItem(STORAGE_KEYS.refreshToken, refresh);
    else localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${path}`, { ...options, headers });

    if (!res.ok) {
      let err: ApiError;
      try {
        err = (await res.json()) as ApiError;
      } catch {
        err = { code: 'unknown', message: res.statusText };
      }
      throw err;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export { APP_CONFIG, API_ROUTES, STORAGE_KEYS };

const TOKEN_KEY = 'zeerocodes.session';
const TENANT_KEY = 'zeerocodes.tenant';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Decode base64url payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as { exp?: number };
    const nowSec = Math.floor(Date.now() / 1000);
    return typeof payload.exp === 'number' && payload.exp > nowSec + 30;
  } catch {
    return false;
  }
}

export async function ensureDevelopmentSession(force = false): Promise<string | null> {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing && isTokenValid(existing) && !force) {
    return existing;
  }

  // Clear stale token
  localStorage.removeItem(TOKEN_KEY);

  try {
    const response = await fetch('/api/auth/dev-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'demo-tenant', userId: 'demo-user' }),
    });
    if (!response.ok) return null;
    const text = await response.text();
    try {
      const data = JSON.parse(text) as { token: string; tenantId: string };
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(TENANT_KEY, data.tenantId || 'demo-tenant');
        return data.token;
      }
    } catch {
      return null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function sessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function sessionTenant(): string | null {
  return localStorage.getItem(TENANT_KEY) || 'demo-tenant';
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let token = await ensureDevelopmentSession();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  // If unauthorized due to token expiration, refresh token and retry once
  if (response.status === 401) {
    const freshToken = await ensureDevelopmentSession(true);
    if (freshToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${freshToken}`);
      return fetch(input, { ...init, headers: retryHeaders });
    }
  }

  return response;
}

export async function readJsonOrThrow<T = any>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text?.trim() || `${fallbackError} (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(json?.error || `${fallbackError} (${res.status})`);
  }
  return json as T;
}

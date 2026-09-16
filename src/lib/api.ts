const TOKEN_KEY = 'zeerocodes.session';
const TENANT_KEY = 'zeerocodes.tenant';

export async function ensureDevelopmentSession(): Promise<string | null> {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;
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
  const token = await ensureDevelopmentSession();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
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

const TOKEN_KEY='zeerocodes.session';
const TENANT_KEY='zeerocodes.tenant';

export async function ensureDevelopmentSession():Promise<string|null>{
  const existing=localStorage.getItem(TOKEN_KEY);if(existing)return existing;
  if(import.meta.env.PROD)return null;
  const response=await fetch('/api/auth/dev-session',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  if(!response.ok)return null;
  const data=await response.json() as {token:string;tenantId:string};
  localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem(TENANT_KEY,data.tenantId);return data.token;
}

export function sessionToken():string|null{return localStorage.getItem(TOKEN_KEY);}
export function sessionTenant():string|null{return localStorage.getItem(TENANT_KEY);}

export async function apiFetch(input:RequestInfo|URL,init:RequestInit={}):Promise<Response>{
  const token=await ensureDevelopmentSession();
  const headers=new Headers(init.headers);if(token)headers.set('Authorization',`Bearer ${token}`);
  return fetch(input,{...init,headers});
}

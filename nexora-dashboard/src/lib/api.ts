const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

export const tokenStore = {
  get: () => localStorage.getItem("nexora_token"),
  set: (token: string) => localStorage.setItem("nexora_token", token),
  clear: () => localStorage.removeItem("nexora_token"),
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `API request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export interface NexoraUser {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  business_name: string;
  role: string;
}

export async function login(email: string, password: string): Promise<NexoraUser> {
  const result = await api<{ access_token: string; user: NexoraUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  tokenStore.set(result.access_token);
  return result.user;
}

export async function getCurrentUser(): Promise<NexoraUser> {
  return api<NexoraUser>("/auth/me");
}

export function logout() {
  tokenStore.clear();
  window.location.reload();
}

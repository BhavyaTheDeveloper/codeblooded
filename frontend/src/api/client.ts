const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: true; data: T } | { success: false; error: string; code?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: json?.error ?? res.statusText,
      code: json?.code,
    };
  }
  return json as { success: true; data: T };
}

export function get<T>(path: string) {
  return api<T>(path, { method: "GET" });
}
export function post<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}
export function patch<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
export function del<T>(path: string) {
  return api<T>(path, { method: "DELETE" });
}

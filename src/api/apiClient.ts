const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7000";
const API_KEY = import.meta.env.VITE_API_KEY || "";

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

export const apiFetch = async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (API_KEY) headers.set("X-API-KEY", API_KEY);
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message || "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

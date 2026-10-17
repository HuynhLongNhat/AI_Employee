import axios, { AxiosRequestConfig } from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

let tokenGetter: (() => Promise<string | null>) | null = null;
let activeBusinessId: string | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export function setActiveBusinessId(id: string | null) {
  activeBusinessId = id;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore
    }
  }

  if (activeBusinessId) {
    config.headers["X-Business-Id"] = activeBusinessId;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url;
    const method = (err?.config?.method ?? "GET").toUpperCase();

    if (status) {
      return Promise.reject(
        new Error(`${method} ${url} failed (HTTP ${status})`),
      );
    }
    return Promise.reject(
      new Error(`${method} ${url} failed: ${err?.message ?? "Network error"}`),
    );
  },
);

export async function apiGet<T>(path: string): Promise<T> {
  const res = await api.get<T>(path);
  return res.data;
}

// Sửa lại hàm apiPost trong lib/api.ts
export async function apiPost<T>(
  path: string,
  body: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await api.post<T>(path, body, config);
  return res.data;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await api.patch<T>(path, body);
  return res.data;
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const res = await api.delete<T>(path);
  return res.data;
}
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "../config/app";
import { buildCacheKey, localCache, sessionCache } from "../lib/localCache";
import { offlineQueue } from "../lib/offlineQueue";
import { supabase } from "../lib/supabase";

const BASE_URL = API_BASE_URL;

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export class ApiClientError extends Error {
  code: string;

  constructor({ code, message }: ApiErrorPayload) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const unwrapResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const { code, message, data } = response.data;

  if (!code.startsWith("S")) {
    throw new ApiClientError({ code, message });
  }

  return data;
};

const toApiClientError = (
  error: AxiosError<ApiResponse<unknown> | ApiErrorPayload>,
): ApiClientError => {
  const payload = error.response?.data;

  return new ApiClientError({
    code: payload?.code ?? "NETWORK_ERROR",
    message:
      payload?.message ??
      error.message ??
      "Network request failed.",
  });
};

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;

  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete http.defaults.headers.common.Authorization;
};

export const clearAccessToken = (): void => {
  setAccessToken(null);
};

/** Supabase 세션에서 토큰을 갱신 */
export async function refreshSupabaseToken(): Promise<string> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    throw new ApiClientError({
      code: "REFRESH_FAILED",
      message: "Supabase 세션 갱신 실패",
    });
  }
  const newToken = data.session.access_token;
  setAccessToken(newToken);
  return newToken;
}

/** 오프라인 전용 플레이스홀더 토큰 */
const OFFLINE_TOKEN = "__offline__";

export function isOfflineToken(): boolean {
  return accessToken === OFFLINE_TOKEN;
}

/** 앱 초기화 시 Supabase 세션 복구 */
export async function restoreSession(): Promise<boolean> {
  // 오프라인이고 이전 세션이 있으면 → 오프라인 통과
  if (!navigator.onLine) {
    const session = sessionCache.get();
    if (session) {
      setAccessToken(OFFLINE_TOKEN);
      console.warn("[Offline] 캐시 세션으로 오프라인 접속 허용");
      return true;
    }
    return false;
  }

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      setAccessToken(data.session.access_token);
      sessionCache.set(data.session.user.email ?? "");
      return true;
    }
    return false;
  } catch {
    clearAccessToken();
    return false;
  }
}

// Supabase 세션 변경 시 axios 헤더 자동 동기화
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    setAccessToken(session.access_token);
    sessionCache.set(session.user.email ?? "");
  } else if (event === "SIGNED_OUT") {
    clearAccessToken();
    sessionCache.clear();
  }
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  async (error: AxiosError) => Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            http(originalRequest).then(resolve).catch((retryError: unknown) => {
              reject(
                retryError instanceof Error
                  ? retryError
                  : new ApiClientError({
                      code: "RETRY_REQUEST_FAILED",
                      message: "Retry request failed",
                    }),
              );
            });
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshSupabaseToken();
        onRefreshed(newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return await http(originalRequest);
      } catch (refreshError: unknown) {
        clearAccessToken();
        throw refreshError instanceof Error
          ? refreshError
          : new ApiClientError({
              code: "REFRESH_FAILED",
              message: "Unable to refresh token",
            });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiClientError(error));
  },
);

/** 네트워크 에러 여부 판별 (서버 응답 없음) */
const isNetworkError = (error: unknown): boolean =>
  error instanceof ApiClientError && error.code === "NETWORK_ERROR";

export const OFFLINE_QUEUED = Symbol("OFFLINE_QUEUED");

const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = buildCacheKey(url, config?.params as Record<string, unknown> | undefined);
    try {
      const result = await http.get<ApiResponse<T>>(url, config).then(unwrapResponse);
      localCache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (isNetworkError(error)) {
        const cached = localCache.get<T>(cacheKey);
        if (cached !== null) {
          console.warn(`[Offline] 캐시 데이터 사용: ${url}`);
          return cached;
        }
      }
      throw error;
    }
  },

  async post<T, B = unknown>(
    url: string,
    data?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      return await http.post<ApiResponse<T>>(url, data, config).then(unwrapResponse);
    } catch (error) {
      if (isNetworkError(error)) {
        offlineQueue.add("post", url, data);
        console.warn(`[Offline] 큐에 저장됨: POST ${url}`);
        return OFFLINE_QUEUED as unknown as T;
      }
      throw error;
    }
  },

  async put<T, B = unknown>(
    url: string,
    data?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      return await http.put<ApiResponse<T>>(url, data, config).then(unwrapResponse);
    } catch (error) {
      if (isNetworkError(error)) {
        offlineQueue.add("put", url, data);
        console.warn(`[Offline] 큐에 저장됨: PUT ${url}`);
        return OFFLINE_QUEUED as unknown as T;
      }
      throw error;
    }
  },

  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      return await http.delete<ApiResponse<T>>(url, config).then(unwrapResponse);
    } catch (error) {
      if (isNetworkError(error)) {
        offlineQueue.add("delete", url, config?.data as unknown);
        console.warn(`[Offline] 큐에 저장됨: DELETE ${url}`);
        return OFFLINE_QUEUED as unknown as T;
      }
      throw error;
    }
  },

  /** 오프라인 큐에 쌓인 요청을 서버로 동기화 */
  async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = offlineQueue.getAll();
    let synced = 0;
    let failed = 0;

    for (const req of queue) {
      try {
        if (req.method === "post") {
          await http.post(`${req.url}`, req.data).then(unwrapResponse);
        } else if (req.method === "put") {
          await http.put(`${req.url}`, req.data).then(unwrapResponse);
        } else if (req.method === "delete") {
          await http.delete(`${req.url}`).then(unwrapResponse);
        }
        offlineQueue.remove(req.id);
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },
};

export default api;

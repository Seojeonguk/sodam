import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "../config/app";
import { buildCacheKey, localCache } from "../lib/localCache";
import { offlineQueue } from "../lib/offlineQueue";

const BASE_URL = API_BASE_URL;

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface ReissueData {
  accessToken: string;
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
  withCredentials: true,
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

export async function requestNewAccessToken(): Promise<string> {
  const response = await axios.post<ApiResponse<ReissueData>>(
    `${BASE_URL}/auth/reissue`,
    {},
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const nextToken = response.data.data.accessToken;
  if (!nextToken) {
    throw new ApiClientError({
      code: "INVALID_REFRESH_RESPONSE",
      message: "Invalid refresh response",
    });
  }

  setAccessToken(nextToken);
  return nextToken;
}

export async function restoreSession(): Promise<boolean> {
  try {
    await requestNewAccessToken();
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
}

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
        const newToken = await requestNewAccessToken();
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

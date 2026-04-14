import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "../config/app";

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

const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http.get<ApiResponse<T>>(url, config).then(unwrapResponse);
  },

  post<T, B = unknown>(
    url: string,
    data?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return http.post<ApiResponse<T>>(url, data, config).then(unwrapResponse);
  },

  put<T, B = unknown>(
    url: string,
    data?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return http.put<ApiResponse<T>>(url, data, config).then(unwrapResponse);
  },

  delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http.delete<ApiResponse<T>>(url, config).then(unwrapResponse);
  },
};

export default api;

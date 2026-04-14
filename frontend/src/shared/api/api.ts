import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL =
  import.meta.env.VITE_API_TRANSACTION_BASE_URL ?? "http://localhost:10003/api";

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface ReissueData {
  accessToken: string;
}

interface ApiErrorPayload {
  code: string;
  message: string;
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void): void => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

async function requestNewAccessToken(): Promise<string> {
  const url = `${BASE_URL}/auth/reissue`;
  const response = await axios.post<ApiResponse<ReissueData>>(
    url,
    {},
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const accessToken = response.data.data.accessToken;
  if (!accessToken) {
    throw new Error("Invalid refresh response");
  }

  localStorage.setItem("accessToken", accessToken);
  return accessToken;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  async (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>) => {
    const { code, message, data } = response.data;

    if (!code.startsWith("S")) {
      throw new Error(message);
    }

    return data;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            api(originalRequest).then(resolve).catch((retryError: unknown) => {
              reject(
                retryError instanceof Error
                  ? retryError
                  : new Error("Retry request failed"),
              );
            });
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await requestNewAccessToken();

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return await api(originalRequest);
      } catch (refreshError: unknown) {
        localStorage.removeItem("accessToken");
        throw refreshError instanceof Error
          ? refreshError
          : new Error("Unable to refresh token");
      } finally {
        isRefreshing = false;
      }
    }

    const payload = error.response?.data;
    const message =
      payload?.message ??
      (error.message || "네트워크 오류가 발생했습니다.");
    const code = payload?.code ?? "NETWORK_ERROR";

    return Promise.reject(
      Object.assign(new Error(message), {
        code,
      } satisfies ApiErrorPayload),
    );
  },
);

export default api;

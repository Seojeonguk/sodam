// src/lib/api.ts
import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * 서버 환경변수 (환경에 맞게 수정)
 * - VITE_API_TRANSACTION_BASE_URL : 기존 API (protected resources)
 * - VITE_API_AUTH_BASE_URL : 인증 서버 (refresh/reissue 엔드포인트가 있는 곳)
 */

const BASE_URL =
  import.meta.env.VITE_API_TRANSACTION_BASE_URL ?? "http://localhost:10003/api";

/** 서버가 반환하는 공통 응답 구조에 맞춘 타입 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** refresh 응답에서 기대하는 실제 데이터 타입 */
interface ReissueData {
  accessToken: string;
}

/** axios 인스턴스 (애플리케이션에서 사용할 주 인스턴스) */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ 쿠키 자동 포함 (refreshToken 전송 목적)
});

/**
 * refresh 동시 처리 관련 상태
 * 여러 요청이 동시에 401이 뜨면 first request만 리프레시 요청을 보내고,
 * 나머지는 새 토큰이 발급될 때까지 대기합니다.
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void): void => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * 실제 토큰 재발급 요청 (인터셉터 루프를 방지하기 위해
 * 이 함수는 'axios' 기본 인스턴스를 사용하여 인터셉터의 영향을 받지 않도록 함)
 */
async function requestNewAccessToken(): Promise<string> {
  try {
    const url = `${BASE_URL}auth/reissue`; // 서버의 리프레시 엔드포인트
    const res: AxiosResponse<ApiResponse<ReissueData>> = await axios.post(
      url,
      {},
      {
        withCredentials: true, // 쿠키(refreshToken)를 함께 보냄
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (
      !res.data?.data?.accessToken ||
      typeof res.data.data.accessToken !== "string"
    ) {
      throw new Error("Invalid refresh response");
    }

    const newAccessToken = res.data.data.accessToken;
    localStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (err: unknown) {
    // 항상 Error 타입으로 던지도록 보장
    if (err instanceof Error) {
      throw err;
    } else {
      throw new Error("Failed to refresh access token");
    }
  }
}

/** 요청 인터셉터: 로컬에 저장된 accessToken을 Authorization 헤더에 넣음 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/** 응답 인터셉터: 401 발생 시 refresh 시도 후 원래 요청 재시도 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401인 경우 (토큰 만료 등)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 refresh 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            // originalRequest를 기반으로 재요청
            api(originalRequest)
              .then(resolve)
              .catch((e) => {
                // Promise.reject 시에는 Error 객체 사용
                reject(
                  e instanceof Error ? e : new Error("Retry request failed")
                );
              });
          });
        });
      }

      // refresh 시작
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await requestNewAccessToken();

        // api 기본 헤더 갱신
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        // 대기중인 요청들 실행
        onRefreshed(newToken);

        // originalRequest에 새 토큰을 넣고 재시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError: unknown) {
        // 토큰 재발급 실패 시 안전하게 처리
        const errToThrow =
          refreshError instanceof Error
            ? refreshError
            : new Error("Unable to refresh token");
        // (원하면) localStorage 초기화 후 로그인 페이지로 리디렉트
        localStorage.removeItem("accessToken");
        // 서버에서 refreshToken을 cookie에 두고 있기 때문에 클라이언트에서 지울 필요 없음
        // 그러나 사용자에게 재로그인 유도:
        // window.location.href = "/login";
        return Promise.reject(errToThrow);
      } finally {
        isRefreshing = false;
      }
    }

    // 401 외의 에러는 그대로 전달 (또는 여기서 공통 에러 처리)
    return Promise.reject(error);
  }
);

export default api;

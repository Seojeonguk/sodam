import axios, { type AxiosInstance, AxiosError } from "axios";

const api: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_TRANSACTION_BASE_URL ??
    "http://localhost:10001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API 요청:", config.url, config.method, config.data);
    return config;
  },
  (error: AxiosError) => {
    console.error("API 요청 에러:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "API 응답 성공:",
      response.config.url,
      response.status,
      response.data,
    );
    return response;
  },
  (error: AxiosError) => {
    console.error("API 응답 에러:", error.response?.status, error.message);

    if (error.response) {
      switch (error.response.status) {
        case 400:
          alert("잘못된 요청입니다. 입력값을 확인해주세요.");
          break;
        case 401:
          alert(
            "인증이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.",
          );
          break;
        case 403:
          alert("접근 권한이 없습니다.");
          break;
        case 404:
          alert("요청하신 리소스를 찾을 수 없습니다.");
          break;
        case 500:
          alert("서버에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          break;
        default:
          alert(`오류 발생: ${error.response.status} - ${error.message}`);
          break;
      }
    } else if (error.request) {
      alert("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } else {
      alert("알 수 없는 오류가 발생했습니다.");
    }

    return Promise.reject(error);
  },
);

export default api;

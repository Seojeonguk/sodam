import api from "../../../shared/api/api";
import { sessionCache } from "../../../shared/lib/localCache";
import type { LoginRequestDto, LoginResponseDto } from "./login.types";

const AUTH_BASE_URL = "/auth";

const LoginApi = {
  login(data: LoginRequestDto): Promise<LoginResponseDto> {
    return api.post<LoginResponseDto, LoginRequestDto>(
      `${AUTH_BASE_URL}/login`,
      data,
    );
  },

  async logout(): Promise<void> {
    await api.post<void>(`${AUTH_BASE_URL}/logout`);
    sessionCache.clear(); // 로그아웃 시 캐시 세션 삭제
  },
};

export default LoginApi;

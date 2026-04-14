import api from "../../../shared/api/api";
import type {
  LoginRequestDto,
  LoginResponseDto,
} from "./login.types";
import type { CommonResponse } from "../../../shared/api/response.types";

const AUTH_BASE_URL = "/auth";

const LoginApi = {
  async login(data: LoginRequestDto): Promise<CommonResponse<LoginResponseDto>> {
    const response = await api.post<CommonResponse<LoginResponseDto>>(
      `${AUTH_BASE_URL}/login`,
      data,
    );

    return response as CommonResponse<LoginResponseDto>;
  },

  async logout(): Promise<CommonResponse<void>> {
    const response = await api.post<CommonResponse<void>>(
      `${AUTH_BASE_URL}/logout`,
    );

    return response as CommonResponse<void>;
  },
};

export default LoginApi;

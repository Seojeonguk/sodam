import api from "../../../shared/api/api";
import type {
  LoginRequestDto,
  LoginResponseDto,
} from "./login.types";

const AUTH_BASE_URL = "/auth";

const LoginApi = {
  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    const response = await api.post<LoginResponseDto>(
      `${AUTH_BASE_URL}/login`,
      data,
    );

    return response as LoginResponseDto;
  },

  async logout(): Promise<void> {
    const response = await api.post<void>(
      `${AUTH_BASE_URL}/logout`,
    );

    return response as void;
  },
};

export default LoginApi;

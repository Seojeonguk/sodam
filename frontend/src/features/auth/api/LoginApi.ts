import axios from "axios";
import api from "../../../shared/api/api";
import type {
  LoginRequestDto,
  LoginResponseDto,
} from "./login.types";
import type { CommonResponse } from "../../../shared/api/response.types";

const AUTH_BASE_URL = "/auth";

const LoginApi = {
  login: async (
    data: LoginRequestDto
  ): Promise<CommonResponse<LoginResponseDto>> => {
    try {
      const response = (await api.post<CommonResponse<LoginResponseDto>>(
        `${AUTH_BASE_URL}/login`,
        data
      )) as unknown as CommonResponse<LoginResponseDto>;
      console.log(`login response : ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? "알 수 없는 오류가 발생했습니다.";
        throw new Error(message)
      } else {
        console.error("unknown error", error);
      }
      throw error;
    }
  },
  logout: async (): Promise<CommonResponse<void>> => {
    try {
      const response = (await api.post<CommonResponse<void>>(
        `${AUTH_BASE_URL}/logout`
      )) as unknown as CommonResponse<void>;
      return response;
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the API call fails, we should proceed with client-side logout
      throw error;
    }
  },
};

export default LoginApi;

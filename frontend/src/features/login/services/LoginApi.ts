import axios from "axios";
import api from "../../../utils/api";
import type {
  CommonResponse,
  LoginRequestDto,
  LoginResponseDto,
} from "./login.types";

const AUTH_BASE_URL = "/auth";

const LoginApi = {
  login: async (
    data: LoginRequestDto
  ): Promise<CommonResponse<LoginResponseDto>> => {
    try {
      const response = await api.post<CommonResponse<LoginResponseDto>>(
        `${AUTH_BASE_URL}/login`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data =
          error.response?.data && typeof error.response.data === "object"
            ? (error.response.data as { message?: string })
            : undefined;
        alert(data?.message ?? "알 수 없는 오류가 발생했습니다.");
        return data as CommonResponse<LoginResponseDto>;
      } else {
        console.error("unknown error", error);
      }
      throw error;
    }
  },
  logout: async (): Promise<CommonResponse<void>> => {
    try {
      const response = await api.post<CommonResponse<void>>(
        `${AUTH_BASE_URL}/logout`
      );
      return response.data;
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the API call fails, we should proceed with client-side logout
      throw error;
    }
  },
};

export default LoginApi;

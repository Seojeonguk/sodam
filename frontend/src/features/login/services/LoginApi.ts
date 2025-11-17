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
    data: LoginRequestDto,
  ): Promise<CommonResponse<LoginResponseDto>> => {
    try {
      const response = await api.post<CommonResponse<LoginResponseDto>>(
        `${AUTH_BASE_URL}/login`,
        data,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        alert(data?.message);
        return data;
      } else {
        console.error("unknown error", error);
      }
      throw error;
    }
  },
};

export default LoginApi;

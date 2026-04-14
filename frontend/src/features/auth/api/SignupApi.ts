import api from "../../../shared/api/api";
import type { SignupRequestDto, SignupResponseDto } from "./signup.types";

const AUTH_BASE_URL = "/auth";

const SignupApi = {
  signup(data: SignupRequestDto): Promise<SignupResponseDto> {
    return api.post<SignupResponseDto, SignupRequestDto>(
      `${AUTH_BASE_URL}/register`,
      data,
    );
  },
};

export default SignupApi;

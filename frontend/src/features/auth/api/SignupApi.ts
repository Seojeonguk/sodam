import axios from "axios";
import api from "../../../shared/api/api";
import type {
    CommonResponse,
    SignupRequestDto,
    SignupResponseDto,
} from "./signup.types";

const AUTH_BASE_URL = "/auth";

const SignupApi = {
    signup: async (
        data: SignupRequestDto
    ): Promise<CommonResponse<SignupResponseDto>> => {
        try {
            const response = (await api.post<CommonResponse<SignupResponseDto>>(
                `${AUTH_BASE_URL}/register`,
                data
            )) as unknown as CommonResponse<SignupResponseDto>;
            console.log(`signup response : ${JSON.stringify(response)}`);
            return response;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data =
                    error.response?.data && typeof error.response.data === "object"
                        ? (error.response.data as { message?: string })
                        : undefined;
                // alert(data?.message ?? "알 수 없는 오류가 발생했습니다.");
                console.error("Signup error details:", data); // Use data to avoid lint error
                // Let the component handle the alert or error display
                throw error;
            } else {
                console.error("unknown error", error);
                throw error;
            }
        }
    },
};

export default SignupApi;

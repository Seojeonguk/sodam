export interface SignupRequestDto {
    email: string;
    password: string;
    name: string;
}

export interface SignupResponseDto {
    email: string;
    name: string;
    // Add other fields returned by the backend if necessary
}

export interface CommonResponse<T> {
    code: string;
    message: string;
    data?: T;
}

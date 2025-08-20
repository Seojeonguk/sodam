export interface LoginRequestDto {
    email : string;
    password:string;
}

export interface CommonResponse<T> {
    code:string;
    message:string;
    data: T;
}

export interface LoginResponseDto {
    accessToken:string;
    refreshToken:string;
}
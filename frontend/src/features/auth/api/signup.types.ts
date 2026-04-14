export interface SignupRequestDto {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponseDto {
  email: string;
  name: string;
}

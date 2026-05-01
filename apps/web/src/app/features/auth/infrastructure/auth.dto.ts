export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  onboardingCompleted: boolean;
}

export interface VerifySignInResponseDto {
  user: AuthUserDto;
  accessToken: string;
}

import { IsEmail } from "class-validator";

export class RequestSignInDto {
  @IsEmail()
  email: string;
}

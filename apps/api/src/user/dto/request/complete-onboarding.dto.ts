import { IsArray, IsString, MinLength } from "class-validator";

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsArray()
  @IsString({ each: true })
  featureConfig: string[];
}

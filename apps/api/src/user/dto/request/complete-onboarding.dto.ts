import { IsArray, IsIn, IsString, MinLength } from "class-validator";
import { FeatureKey } from "@user/domain";

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsArray()
  @IsIn(Object.values(FeatureKey), { each: true })
  featureConfig: string[];
}

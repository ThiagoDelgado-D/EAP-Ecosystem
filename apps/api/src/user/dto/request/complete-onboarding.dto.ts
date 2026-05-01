import { IsArray, IsIn, IsString, MinLength } from "class-validator";
import { FeatureKey } from "@user/domain";
import { Transform } from "class-transformer";

export class CompleteOnboardingDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsArray()
  @IsIn(Object.values(FeatureKey), { each: true })
  featureConfig: string[];
}

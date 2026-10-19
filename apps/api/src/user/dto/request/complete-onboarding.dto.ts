import { IsArray, IsIn, IsString, MinLength } from "class-validator";
import { OPTIONAL_MODULES } from "@user/domain";
import { Transform } from "class-transformer";

export class CompleteOnboardingDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsArray()
  @IsIn(OPTIONAL_MODULES, { each: true })
  enabledModules: string[];
}

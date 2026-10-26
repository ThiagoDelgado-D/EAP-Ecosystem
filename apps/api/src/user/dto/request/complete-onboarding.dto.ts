import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { OPTIONAL_MODULES, WEEKLY_GOAL_MINUTES_RANGE } from "@user/domain";
import { Transform, Type } from "class-transformer";
import { IntakeAnswersDto } from "./intake-answers.dto.js";

export class CompleteOnboardingDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsArray()
  @IsIn(OPTIONAL_MODULES, { each: true })
  enabledModules: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => IntakeAnswersDto)
  intake?: IntakeAnswersDto;

  @IsOptional()
  @IsInt()
  @Min(WEEKLY_GOAL_MINUTES_RANGE.MIN)
  @Max(WEEKLY_GOAL_MINUTES_RANGE.MAX)
  weeklyGoalMinutes?: number;
}

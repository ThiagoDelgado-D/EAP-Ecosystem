import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { LanguageCode, StartOfWeek, WEEKLY_GOAL_MINUTES_RANGE } from "@user/domain";

export class UpdateUserAppearanceDto {
  @IsOptional()
  @IsNotEmpty()
  @IsIn(Object.values(LanguageCode))
  language?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsIn(Object.values(StartOfWeek))
  startOfWeek?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  reduceMotion?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(WEEKLY_GOAL_MINUTES_RANGE.MIN)
  @Max(WEEKLY_GOAL_MINUTES_RANGE.MAX)
  weeklyGoalMinutes?: number;
}

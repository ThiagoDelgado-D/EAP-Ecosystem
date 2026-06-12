import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { LanguageCode, StartOfWeek } from "@user/domain";

export class UpdateUserAppearanceDto {
  @IsOptional()
  @IsIn(Object.values(LanguageCode))
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(Object.values(StartOfWeek))
  startOfWeek?: string;

  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;
}

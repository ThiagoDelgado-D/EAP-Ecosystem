import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { LanguageCode, StartOfWeek } from "@user/domain";

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
}

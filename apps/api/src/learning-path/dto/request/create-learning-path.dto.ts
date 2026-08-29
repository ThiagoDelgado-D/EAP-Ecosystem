import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { PathMode, PathSource } from "@learning-resource/domain";

export class CreateLearningPathDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(PathMode)
  mode: PathMode;

  @IsOptional()
  @IsEnum(PathSource)
  source?: PathSource;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceSlug?: string;
}

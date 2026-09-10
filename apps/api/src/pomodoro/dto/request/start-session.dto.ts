import { IsInt, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SessionTargetDto } from "./session-target.dto.js";

export class StartSessionDto {
  @IsInt()
  @IsPositive()
  plannedMin!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  intent?: string;

  @ValidateNested()
  @Type(() => SessionTargetDto)
  target!: SessionTargetDto;
}

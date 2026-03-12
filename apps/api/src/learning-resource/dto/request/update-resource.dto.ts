import {
  IsString,
  IsUrl,
  IsUUID,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
} from "class-validator";
import type { UUID } from "domain-lib";

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.url !== "")
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsUUID()
  typeId?: UUID;

  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  topicIds?: UUID[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

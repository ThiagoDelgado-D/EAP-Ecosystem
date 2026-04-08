import {
  IsString,
  IsUrl,
  IsUUID,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { MentalStateType } from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.url !== undefined && o.url !== "")
  @IsUrl({
    require_tld: true,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  url?: string;

  @IsOptional()
  @ValidateIf((o) => o.imageUrl !== undefined && o.imageUrl !== "")
  @IsUrl({
    require_tld: true,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  imageUrl?: string;

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
  @IsEnum(MentalStateType)
  mentalState?: MentalStateType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

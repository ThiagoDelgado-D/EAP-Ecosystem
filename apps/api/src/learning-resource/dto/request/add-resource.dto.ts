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
  MinLength,
  ArrayMinSize,
} from "class-validator";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { Transform } from "class-transformer";

export class AddResourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl({
    require_tld: true,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  url?: string;
  @IsUUID()
  resourceTypeId: UUID;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  topicIds: UUID[];

  @IsEnum(DifficultyType)
  difficulty: DifficultyType;

  @IsInt()
  @IsPositive()
  estimatedDurationMinutes: number;

  @IsOptional()
  @IsEnum(EnergyLevelType)
  energyLevel?: EnergyLevelType;

  @IsOptional()
  @IsEnum(ResourceStatusType)
  status?: ResourceStatusType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

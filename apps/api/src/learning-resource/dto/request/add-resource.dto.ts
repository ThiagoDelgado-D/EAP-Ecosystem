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

export class AddResourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsUUID()
  resourceTypeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  topicIds: string[];

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

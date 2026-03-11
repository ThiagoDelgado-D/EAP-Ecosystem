import { IsArray, IsEnum, IsOptional, IsUUID } from "class-validator";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { Transform } from "class-transformer";

export class GetResourcesFilterDto {
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  @Transform(({ value }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  topicIds?: string[];

  @IsOptional()
  @IsEnum(DifficultyType)
  difficulty?: DifficultyType;

  @IsOptional()
  @IsEnum(EnergyLevelType)
  energyLevel?: EnergyLevelType;

  @IsOptional()
  @IsEnum(ResourceStatusType)
  status?: ResourceStatusType;

  @IsOptional()
  @IsUUID()
  resourceTypeId?: string;
}

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { NodeProgress } from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export class UpdateLearningPathNodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl({ require_tld: true, require_protocol: true, protocols: ["http", "https"] })
  externalUrl?: string;

  // null unlinks the resource (demotes the node to a path-local stub);
  // undefined means "leave untouched" — the use case treats the two differently.
  @IsOptional()
  @IsUUID()
  learningResourceId?: UUID | null;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsEnum(NodeProgress)
  progress?: NodeProgress;
}

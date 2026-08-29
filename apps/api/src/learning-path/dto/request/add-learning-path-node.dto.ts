import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { NodeProgress, StubScope } from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export class AddLearningPathNodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl({ require_tld: true, require_protocol: true, protocols: ["http", "https"] })
  externalUrl?: string;

  @IsOptional()
  @IsUUID()
  learningResourceId?: UUID;

  @IsOptional()
  @IsEnum(StubScope)
  stubScope?: StubScope;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsEnum(NodeProgress)
  progress?: NodeProgress;
}

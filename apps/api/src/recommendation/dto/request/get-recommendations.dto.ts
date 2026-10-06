import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import type { UUID } from "domain-lib";
import { MAX_EXCLUDED_CANDIDATES } from "@recommendation/application";

export class GetRecommendationsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXCLUDED_CANDIDATES)
  @IsUUID("all", { each: true })
  @Transform(({ value }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  exclude?: UUID[];
}

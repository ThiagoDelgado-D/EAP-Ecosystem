import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import type { UUID } from "domain-lib";
import { MAX_EXCLUDED_CANDIDATES } from "@recommendation/application";

const toArray = (value: unknown): unknown[] | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
};

export class GetRecommendationsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXCLUDED_CANDIDATES)
  @IsUUID("all", { each: true })
  @Transform(({ value }) => toArray(value))
  exclude?: UUID[];
}

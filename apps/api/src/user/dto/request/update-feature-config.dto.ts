import { IsArray, IsIn } from "class-validator";
import { FeatureKey } from "@user/domain";

export class UpdateFeatureConfigDto {
  @IsArray()
  @IsIn(Object.values(FeatureKey), { each: true })
  featureConfig: string[];
}

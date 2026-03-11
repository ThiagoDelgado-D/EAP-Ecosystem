import { IsEnum } from "class-validator";
import { ResourceStatusType } from "@learning-resource/domain";

export class ToggleStatusDto {
  @IsEnum(ResourceStatusType)
  status: ResourceStatusType;
}

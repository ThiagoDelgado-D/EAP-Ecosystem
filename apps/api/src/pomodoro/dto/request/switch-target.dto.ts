import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SessionTargetDto } from "./session-target.dto.js";

export class SwitchTargetDto {
  @ValidateNested()
  @Type(() => SessionTargetDto)
  target!: SessionTargetDto;
}

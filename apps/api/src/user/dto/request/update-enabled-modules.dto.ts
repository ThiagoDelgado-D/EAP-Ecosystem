import { IsArray, IsIn } from "class-validator";
import { OPTIONAL_MODULES, type ModuleKey } from "@user/domain";

export class UpdateEnabledModulesDto {
  @IsArray()
  @IsIn(OPTIONAL_MODULES, { each: true })
  enabledModules: ModuleKey[];
}

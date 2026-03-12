import { IsEnum } from "class-validator";
import { EnergyLevelType } from "@learning-resource/domain";

export class ToggleEnergyDto {
  @IsEnum(EnergyLevelType)
  energyLevel: EnergyLevelType;
}

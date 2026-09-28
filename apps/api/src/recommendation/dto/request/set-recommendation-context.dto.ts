import { IsEnum, IsInt, IsOptional, IsPositive } from "class-validator";
import { EnergyLevel, MentalState } from "@recommendation/domain";

export class SetRecommendationContextDto {
  @IsEnum(EnergyLevel)
  energyLevel!: EnergyLevel;

  @IsOptional()
  @IsInt()
  @IsPositive()
  availableMinutes?: number;

  @IsOptional()
  @IsEnum(MentalState)
  mentalState?: MentalState;
}

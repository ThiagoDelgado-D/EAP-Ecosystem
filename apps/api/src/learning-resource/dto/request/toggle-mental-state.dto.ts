import { IsEnum } from "class-validator";
import { MentalStateType } from "@learning-resource/domain";

export class ToggleMentalStateDto {
  @IsEnum(MentalStateType)
  mentalState!: MentalStateType;
}

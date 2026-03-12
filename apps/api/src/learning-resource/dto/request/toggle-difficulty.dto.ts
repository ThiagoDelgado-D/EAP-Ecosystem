import { IsEnum } from "class-validator";
import { DifficultyType } from "@learning-resource/domain";

export class ToggleDifficultyDto {
  @IsEnum(DifficultyType)
  difficulty: DifficultyType;
}

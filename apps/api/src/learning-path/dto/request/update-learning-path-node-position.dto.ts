import { IsNumber } from "class-validator";

export class UpdateLearningPathNodePositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

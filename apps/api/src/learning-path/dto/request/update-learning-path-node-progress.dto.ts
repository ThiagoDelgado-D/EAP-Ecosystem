import { IsEnum } from "class-validator";
import { NodeProgress } from "@learning-resource/domain";

export class UpdateLearningPathNodeProgressDto {
  @IsEnum(NodeProgress)
  progress: NodeProgress;
}

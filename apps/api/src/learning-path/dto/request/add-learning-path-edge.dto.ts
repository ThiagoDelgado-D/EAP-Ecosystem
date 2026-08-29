import { IsUUID } from "class-validator";
import type { UUID } from "domain-lib";

export class AddLearningPathEdgeDto {
  @IsUUID()
  sourceNodeId: UUID;

  @IsUUID()
  targetNodeId: UUID;
}

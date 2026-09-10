import { IsEnum, IsUUID, ValidateIf } from "class-validator";
import { SegmentTargetKind } from "@pomodoro/domain";
import type { UUID } from "domain-lib";

export class SessionTargetDto {
  @IsEnum(SegmentTargetKind)
  kind!: SegmentTargetKind;

  @ValidateIf(
    (o: SessionTargetDto) =>
      o.kind === SegmentTargetKind.RESOURCE || o.resourceId !== undefined,
  )
  @IsUUID()
  resourceId?: UUID;

  @ValidateIf(
    (o: SessionTargetDto) =>
      o.kind === SegmentTargetKind.NODE || o.learningPathId !== undefined,
  )
  @IsUUID()
  learningPathId?: UUID;

  @ValidateIf((o: SessionTargetDto) => o.kind === SegmentTargetKind.NODE)
  @IsUUID()
  learningPathNodeId?: UUID;
}

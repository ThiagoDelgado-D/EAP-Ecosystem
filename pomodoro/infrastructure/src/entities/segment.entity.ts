import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("pomodoro_segments")
export class SegmentEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  sessionId!: string;

  @Column("int")
  startSec!: number;

  @Column({ type: "int", nullable: true })
  endSec!: number | null;

  @Column({ type: "varchar", length: 20 })
  targetKind!: string;

  @Column({ type: "uuid", nullable: true })
  resourceId!: string | null;

  @Column({ type: "uuid", nullable: true })
  learningPathId!: string | null;

  @Column({ type: "uuid", nullable: true })
  learningPathNodeId!: string | null;
}

import { Column, Entity, PrimaryColumn } from "typeorm";
import { timestamptzType } from "infrastructure-lib";

@Entity("pomodoro_sessions")
export class PomodoroSessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: timestamptzType() })
  startedAt!: Date;

  @Column({ type: timestamptzType(), nullable: true })
  completedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  intent!: string | null;

  @Column("int")
  plannedMin!: number;

  @Column({ type: "boolean", default: false })
  autoCompleted!: boolean;
}

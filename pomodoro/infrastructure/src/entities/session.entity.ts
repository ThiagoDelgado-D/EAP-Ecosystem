import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("pomodoro_sessions")
export class SessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: "timestamptz" })
  startedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  intent!: string | null;

  @Column("int")
  plannedMin!: number;

  @Column({ type: "boolean", default: false })
  autoCompleted!: boolean;
}

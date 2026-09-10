import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("pomodoro_sessions")
export class SessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: "timestamp" })
  startedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  intent!: string | null;

  @Column("int")
  plannedMin!: number;
}

import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("pomodoro_breaks")
export class BreakEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: "timestamp" })
  startedAt!: Date;

  @Column("int")
  durationSec!: number;

  @Column({ type: "timestamp", nullable: true })
  endedAt!: Date | null;
}

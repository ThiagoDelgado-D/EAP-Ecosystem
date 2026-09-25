import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("pomodoro_breaks")
export class BreakEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: "timestamptz" })
  startedAt!: Date;

  @Column("int")
  durationSec!: number;

  @Column({ type: "timestamptz", nullable: true })
  endedAt!: Date | null;
}

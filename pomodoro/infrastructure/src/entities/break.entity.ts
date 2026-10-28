import { Column, Entity, PrimaryColumn } from "typeorm";
import { timestamptzType } from "infrastructure-lib";

@Entity("pomodoro_breaks")
export class BreakEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ type: timestamptzType() })
  startedAt!: Date;

  @Column("int")
  durationSec!: number;

  @Column({ type: timestamptzType(), nullable: true })
  endedAt!: Date | null;
}

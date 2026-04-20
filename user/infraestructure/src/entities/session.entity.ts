import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UserEntity } from "./user.entity.js";

@Entity("sessions")
export class SessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @Column({ unique: true })
  @Index()
  refreshTokenHash!: string;

  @Column("timestamp")
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  revokedAt!: Date | null;

  @Column({ type: "varchar", nullable: true })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

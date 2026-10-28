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
import { timestampType } from "infrastructure-lib";

@Entity("sessions")
export class SessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @Column({ unique: true })
  refreshTokenHash!: string;

  @Column({ type: timestampType() })
  expiresAt!: Date;

  @Column({ type: timestampType(), nullable: true })
  revokedAt!: Date | null;

  @Column({ type: timestampType(), nullable: true })
  rotatedAt!: Date | null;

  @Column({ type: "uuid", nullable: true })
  replacedBySessionId!: string | null;

  @Column({ type: "varchar", nullable: true })
  userAgent!: string | null;

  @Column({ type: "varchar", nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { timestampType } from "infrastructure-lib";

@Entity("sign_in_challenges")
@Index(["email", "consumed"])
export class SignInChallengeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  email!: string;

  @Column()
  codeHash!: string;

  @Column({ type: timestampType() })
  expiresAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ default: false })
  consumed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

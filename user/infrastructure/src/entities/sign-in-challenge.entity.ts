import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity("sign_in_challenges")
@Index(["email", "consumed"])
export class SignInChallengeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  email!: string;

  @Column()
  codeHash!: string;

  @Column("timestamp")
  expiresAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ default: false })
  consumed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

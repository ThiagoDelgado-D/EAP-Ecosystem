import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class UserEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: "varchar", nullable: true })
  userName!: string | null;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ default: false })
  onboardingCompleted!: boolean;

  @Column({ type: "text", array: true, default: "{}" })
  featureConfig!: string[];

  @Column({ type: "text", array: true, default: "{}" })
  widgetConfig!: string[];

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ type: "uuid", nullable: true })
  avatar!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

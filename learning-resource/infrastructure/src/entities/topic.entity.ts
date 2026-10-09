import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("topics")
@Index("idx_topics_user_lower_name", { synchronize: false })
export class TopicEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20 })
  color!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

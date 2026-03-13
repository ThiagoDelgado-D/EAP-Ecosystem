import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("topics")
export class TopicEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7 })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

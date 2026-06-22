import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("learning_paths")
export class LearningPathEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  userId!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ length: 20 })
  mode!: string;

  @Column({ length: 20 })
  source!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  sourceSlug!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

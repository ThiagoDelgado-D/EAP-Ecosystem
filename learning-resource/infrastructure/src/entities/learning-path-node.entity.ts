import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { LearningPathEntity } from "./learning-path.entity.js";

@Entity("learning_path_nodes")
export class LearningPathNodeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  pathId!: string;

  @ManyToOne(() => LearningPathEntity, (path) => path.nodes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "pathId" })
  path!: LearningPathEntity;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 2048, nullable: true })
  externalUrl!: string | null;

  @Column({ type: "uuid", nullable: true })
  learningResourceId!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  stubScope!: string | null;

  @Column({ type: "int", nullable: true })
  order!: number | null;

  @Column({ length: 20, default: "pending" })
  progress!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

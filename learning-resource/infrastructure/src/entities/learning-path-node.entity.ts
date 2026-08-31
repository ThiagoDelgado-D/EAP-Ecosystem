import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("learning_path_nodes")
export class LearningPathNodeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  pathId!: string;

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

  @Column({ type: "double precision", nullable: true })
  x!: number | null;

  @Column({ type: "double precision", nullable: true })
  y!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

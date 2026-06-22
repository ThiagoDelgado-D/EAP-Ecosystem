import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { LearningPathNodeEntity } from "./learning-path-node.entity.js";

@Entity("learning_path_edges")
export class LearningPathEdgeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  pathId!: string;

  @Column("uuid")
  sourceNodeId!: string;

  @Column("uuid")
  targetNodeId!: string;

  @ManyToOne(() => LearningPathNodeEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sourceNodeId" })
  sourceNode!: LearningPathNodeEntity;

  @ManyToOne(() => LearningPathNodeEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "targetNodeId" })
  targetNode!: LearningPathNodeEntity;
}

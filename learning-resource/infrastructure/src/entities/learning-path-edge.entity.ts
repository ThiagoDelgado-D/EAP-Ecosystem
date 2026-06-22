import { Column, Entity, PrimaryColumn } from "typeorm";

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
}

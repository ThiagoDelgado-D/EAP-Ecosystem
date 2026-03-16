import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { TopicEntity } from "./topic.entity.js";
import { ResourceTypeEntity } from "./resource-type.entity.js";

@Entity("learning_resources")
export class LearningResourceEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: "varchar", nullable: true, length: 2048 })
  url!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ length: 20 })
  difficulty!: string;

  @Column({ length: 20 })
  energyLevel!: string;

  @Column({ length: 20 })
  status!: string;

  @Column({ type: "int", nullable: true })
  estimatedDurationMinutes!: number | null;

  @Column({ default: true })
  isDurationEstimated!: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastViewedAt!: Date | null;

  @ManyToOne(() => ResourceTypeEntity)
  @JoinColumn({ name: "resourceTypeId" })
  resourceType!: ResourceTypeEntity;

  @Column()
  resourceTypeId!: string;

  @ManyToMany(() => TopicEntity)
  @JoinTable({
    name: "learning_resource_topics",
    joinColumn: { name: "learningResourceId" },
    inverseJoinColumn: { name: "topicId" },
  })
  topics!: TopicEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

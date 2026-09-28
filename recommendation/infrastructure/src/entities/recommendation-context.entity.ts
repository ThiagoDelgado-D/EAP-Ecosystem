import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("recommendation_contexts")
export class RecommendationContextEntity {
  @PrimaryColumn("uuid")
  userId!: string;

  @Column({ length: 20 })
  energyLevel!: string;

  @Column({ type: "int", nullable: true })
  availableMinutes!: number | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  mentalState!: string | null;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}

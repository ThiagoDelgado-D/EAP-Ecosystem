import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("resource_types")
export class ResourceTypeEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ length: 100 })
  displayName!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

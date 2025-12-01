import { UUID } from "domain-lib";
import { LearningResource } from "../entities/learning-resource";

export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  update(id: UUID, resource: Partial<LearningResource>): Promise<void>;
  delete(id: UUID): Promise<void>;
  findAll(): Promise<LearningResource[]>;
  findById(id: UUID): Promise<LearningResource | null>;
}

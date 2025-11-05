import { UUID } from "domain-lib";
import { LearningResource } from "../entities/learning-resource";

export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  update(
    id: UUID,
    resource: Partial<LearningResource>
  ): Promise<LearningResource | null>;
  delete(id: UUID): Promise<void>;
  findAll(): Promise<LearningResource[]>;
  findById(): Promise<LearningResource | null>;
}

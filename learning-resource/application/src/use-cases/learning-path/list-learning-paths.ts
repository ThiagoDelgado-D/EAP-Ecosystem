import { type CurrentUser } from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPath,
} from "@learning-resource/domain";

export interface ListLearningPathsDependencies {
  learningPathRepository: ILearningPathRepository;
  currentUser: CurrentUser;
}

export const listLearningPaths = async (
  { learningPathRepository, currentUser }: ListLearningPathsDependencies,
): Promise<LearningPath[]> => {
  return learningPathRepository.findAllByUserId(currentUser.id);
};

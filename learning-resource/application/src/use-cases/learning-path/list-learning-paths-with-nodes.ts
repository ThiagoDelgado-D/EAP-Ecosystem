import { type CurrentUser } from "domain-lib";
import {
  type ILearningPathRepository,
  type LearningPathWithNodes,
} from "@learning-resource/domain";

export interface ListLearningPathsWithNodesDependencies {
  learningPathRepository: ILearningPathRepository;
  currentUser: CurrentUser;
}

export const listLearningPathsWithNodes = async (
  { learningPathRepository, currentUser }: ListLearningPathsWithNodesDependencies,
): Promise<LearningPathWithNodes[]> => {
  return learningPathRepository.findAllByUserIdWithNodes(currentUser.id);
};

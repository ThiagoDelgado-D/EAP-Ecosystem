import type {
  ILearningResourceRepository,
  LearningResource,
} from "@learning-resource/domain";
import type { CurrentUser } from "domain-lib";

export type ResourceFormatted = Pick<
  LearningResource,
  | "id"
  | "title"
  | "energyLevel"
  | "difficulty"
  | "status"
  | "typeId"
  | "topicIds"
>;

export interface ListFormattedResourcesDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
}
export interface listFormattedResourcesResponseModel {
  resources: ResourceFormatted[];
}

export const listFormattedResourcesLearning = async ({
  learningResourceRepository,
  currentUser,
}: ListFormattedResourcesDependencies): Promise<listFormattedResourcesResponseModel> => {
  const resources = await learningResourceRepository.findAllByUserId(currentUser.id);

  const formattedCourses: ResourceFormatted[] = resources.map((resources) => ({
    id: resources.id,
    title: resources.title,
    energyLevel: resources.energyLevel,
    difficulty: resources.difficulty,
    status: resources.status,
    typeId: resources.typeId,
    topicIds: resources.topicIds,
  }));

  return {
    resources: formattedCourses,
  };
};

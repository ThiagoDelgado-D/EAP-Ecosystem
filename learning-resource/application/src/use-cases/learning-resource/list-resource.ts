import {
  ILearningResourceRepository,
  LearningResource,
} from "@learning-resource/domain";

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
}
export interface listFormattedResourcesResponseModel {
  resources: ResourceFormatted[];
}

export const listFormattedResourcesLearning = async ({
  learningResourceRepository,
}: ListFormattedResourcesDependencies) => {
  const resources = await learningResourceRepository.getAll();

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
    courses: formattedCourses,
  };
};

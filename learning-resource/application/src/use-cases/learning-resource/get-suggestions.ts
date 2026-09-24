import type { ILearningResourceRepository } from "@learning-resource/domain";
import type { CurrentUser } from "domain-lib";

export interface GetSuggestionsDeps {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
}

export const getSuggestions = async (
  { learningResourceRepository, currentUser }: GetSuggestionsDeps,
  q: string,
): Promise<{ suggestions: string[] }> => {
  if (!q || q.trim().length < 2) return { suggestions: [] };
  const suggestions = await learningResourceRepository.findSimilarTitles(currentUser.id, q.trim());
  return { suggestions };
};

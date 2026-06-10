import type { ILearningResourceRepository } from "@learning-resource/domain";

export interface GetSuggestionsDeps {
  learningResourceRepository: ILearningResourceRepository;
}

export const getSuggestions = async (
  { learningResourceRepository }: GetSuggestionsDeps,
  q: string,
): Promise<{ suggestions: string[] }> => {
  if (!q || q.trim().length < 2) return { suggestions: [] };
  const suggestions = await learningResourceRepository.findSimilarTitles(q.trim());
  return { suggestions };
};

import {
  createValidationSchema,
  enumField,
  InvalidDataError,
  optionalEnum,
  optionalNumber,
  ValidationError,
  type CurrentUser,
} from "domain-lib";
import {
  EnergyLevel,
  MentalState,
  type IRecommendationContextRepository,
  type RecommendationContext,
} from "@recommendation/domain";

export interface SetRecommendationContextDependencies {
  recommendationContextRepository: IRecommendationContextRepository;
  currentUser: CurrentUser;
}

export interface SetRecommendationContextRequestModel {
  energyLevel: EnergyLevel;
  availableMinutes?: number;
  mentalState?: MentalState;
}

export type SetRecommendationContextResponseModel = RecommendationContext;

const setRecommendationContextSchema =
  createValidationSchema<SetRecommendationContextRequestModel>({
    energyLevel: enumField(Object.values(EnergyLevel), "Energy level", {
      required: true,
    }),
    availableMinutes: optionalNumber("Available minutes", {
      integer: true,
      positive: true,
    }),
    mentalState: optionalEnum(Object.values(MentalState), "Mental state"),
  });

export const setRecommendationContext = async (
  { recommendationContextRepository, currentUser }: SetRecommendationContextDependencies,
  request: SetRecommendationContextRequestModel,
): Promise<SetRecommendationContextResponseModel | InvalidDataError> => {
  const validationResult = setRecommendationContextSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { energyLevel, availableMinutes, mentalState } = validationResult;

  return recommendationContextRepository.save({
    userId: currentUser.id,
    energyLevel,
    availableMinutes,
    mentalState,
    updatedAt: new Date(),
  });
};

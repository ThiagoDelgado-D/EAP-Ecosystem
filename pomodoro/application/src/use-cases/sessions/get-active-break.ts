import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";

export interface GetActiveBreakDependencies {
  breakRepository: IBreakRepository;
}

export interface GetActiveBreakRequestModel {
  userId: UUID;
}

const getActiveBreakSchema = createValidationSchema<GetActiveBreakRequestModel>({
  userId: uuidField("UserId", { required: true }),
});

export const getActiveBreak = async (
  { breakRepository }: GetActiveBreakDependencies,
  request: GetActiveBreakRequestModel,
): Promise<Break | null | InvalidDataError> => {
  const validationResult = getActiveBreakSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  return await breakRepository.findActiveByUserId(validationResult.userId);
};

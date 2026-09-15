import {
  createValidationSchema,
  dateField,
  optionalDate,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";

export interface GetBreakHistoryDependencies {
  breakRepository: IBreakRepository;
}

export interface GetBreakHistoryRequestModel {
  userId: UUID;
  since: Date;
  until?: Date;
}

const getBreakHistorySchema =
  createValidationSchema<GetBreakHistoryRequestModel>({
    userId: uuidField("UserId", { required: true }),
    since: dateField("Since", { required: true }),
    until: optionalDate("Until"),
  });

export const getBreakHistory = async (
  { breakRepository }: GetBreakHistoryDependencies,
  request: GetBreakHistoryRequestModel,
): Promise<Break[] | InvalidDataError> => {
  const validationResult = getBreakHistorySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { userId, since, until } = validationResult;

  return await breakRepository.findByUserIdBetween(userId, since, until);
};

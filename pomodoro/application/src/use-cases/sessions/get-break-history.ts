import {
  createValidationSchema,
  dateField,
  optionalDate,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
} from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";

export interface GetBreakHistoryDependencies {
  breakRepository: IBreakRepository;
  currentUser: CurrentUser;
}

export interface GetBreakHistoryRequestModel {
  since: Date;
  until?: Date;
}

const getBreakHistorySchema =
  createValidationSchema<GetBreakHistoryRequestModel>({
    since: dateField("Since", { required: true }),
    until: optionalDate("Until"),
  });

export const getBreakHistory = async (
  { breakRepository, currentUser }: GetBreakHistoryDependencies,
  request: GetBreakHistoryRequestModel,
): Promise<Break[] | InvalidDataError> => {
  const validationResult = getBreakHistorySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { since, until } = validationResult;

  return await breakRepository.findByUserIdBetween(currentUser.id, since, until);
};

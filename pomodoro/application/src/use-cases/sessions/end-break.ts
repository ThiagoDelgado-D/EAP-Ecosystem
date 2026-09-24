import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";
import { BreakNotActiveError } from "../../errors/break-not-active.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { verifyBreakOwnership } from "./verify-break-ownership.js";

export interface EndBreakDependencies {
  breakRepository: IBreakRepository;
  currentUser: CurrentUser;
}

export interface EndBreakRequestModel {
  breakId: UUID;
}

const endBreakSchema = createValidationSchema<EndBreakRequestModel>({
  breakId: uuidField("BreakId", { required: true }),
});

export const endBreak = async (
  { breakRepository, currentUser }: EndBreakDependencies,
  request: EndBreakRequestModel,
): Promise<
  | Break
  | InvalidDataError
  | BreakNotFoundError
  | BreakForbiddenError
  | BreakNotActiveError
> => {
  const validationResult = endBreakSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const validatedData = validationResult;

  const activeBreak = await verifyBreakOwnership(
    breakRepository,
    validatedData.breakId,
    currentUser,
  );

  if (
    activeBreak instanceof BreakNotFoundError ||
    activeBreak instanceof BreakForbiddenError
  ) {
    return activeBreak;
  }

  if (activeBreak.endedAt) {
    return new BreakNotActiveError(activeBreak.id);
  }

  const endedBreak: Break = { ...activeBreak, endedAt: new Date() };
  await breakRepository.update(endedBreak);

  return endedBreak;
};

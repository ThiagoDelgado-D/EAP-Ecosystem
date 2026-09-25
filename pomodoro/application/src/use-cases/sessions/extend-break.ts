import {
  createValidationSchema,
  positiveNumber,
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

export interface ExtendBreakDependencies {
  breakRepository: IBreakRepository;
  currentUser: CurrentUser;
}

export interface ExtendBreakRequestModel {
  breakId: UUID;
  seconds: number;
}

const extendBreakSchema = createValidationSchema<ExtendBreakRequestModel>({
  breakId: uuidField("BreakId", { required: true }),
  seconds: positiveNumber("Seconds", { integer: true }),
});

export const extendBreak = async (
  { breakRepository, currentUser }: ExtendBreakDependencies,
  request: ExtendBreakRequestModel,
): Promise<
  | Break
  | InvalidDataError
  | BreakNotFoundError
  | BreakForbiddenError
  | BreakNotActiveError
> => {
  const validationResult = extendBreakSchema(request);
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

  const extendedBreak: Break = {
    ...activeBreak,
    durationSec: activeBreak.durationSec + validatedData.seconds,
  };
  await breakRepository.update(extendedBreak);

  return extendedBreak;
};

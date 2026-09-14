import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";
import { BreakNotActiveError } from "../../errors/break-not-active.js";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";
import { verifyBreakOwnership } from "./verify-break-ownership.js";

export interface EndBreakDependencies {
  breakRepository: IBreakRepository;
}

export interface EndBreakRequestModel {
  userId: UUID;
  breakId: UUID;
}

const endBreakSchema = createValidationSchema<EndBreakRequestModel>({
  userId: uuidField("UserId", { required: true }),
  breakId: uuidField("BreakId", { required: true }),
});

export const endBreak = async (
  { breakRepository }: EndBreakDependencies,
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
    validatedData.userId,
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

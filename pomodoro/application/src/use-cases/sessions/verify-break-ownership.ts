import type { CurrentUser, UUID } from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";
import { BreakNotFoundError } from "../../errors/break-not-found.js";
import { BreakForbiddenError } from "../../errors/break-forbidden.js";

export const verifyBreakOwnership = async (
  breakRepository: IBreakRepository,
  breakId: UUID,
  currentUser: CurrentUser,
): Promise<Break | BreakNotFoundError | BreakForbiddenError> => {
  const activeBreak = await breakRepository.findById(breakId);
  if (!activeBreak) return new BreakNotFoundError();
  if (activeBreak.userId !== currentUser.id) return new BreakForbiddenError();
  return activeBreak;
};

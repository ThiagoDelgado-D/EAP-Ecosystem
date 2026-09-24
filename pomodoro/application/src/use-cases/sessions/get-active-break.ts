import type { CurrentUser } from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";

export interface GetActiveBreakDependencies {
  breakRepository: IBreakRepository;
  currentUser: CurrentUser;
}

export const getActiveBreak = async (
  { breakRepository, currentUser }: GetActiveBreakDependencies,
): Promise<Break | null> => {
  return await breakRepository.findActiveByUserId(currentUser.id);
};

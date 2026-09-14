import type { UUID } from "domain-lib";
import type { Break, IBreakRepository } from "@pomodoro/domain";

export interface MockedBreakRepository extends IBreakRepository {
  breaks: Break[];
  reset(): void;
}

export function mockBreakRepository(
  initial: { breaks?: Break[] } = {},
): MockedBreakRepository {
  return {
    breaks: [...(initial.breaks ?? [])],

    async save(newBreak: Break): Promise<Break> {
      this.breaks.push(newBreak);
      return newBreak;
    },

    async findActiveByUserId(userId: UUID): Promise<Break | null> {
      return (
        this.breaks.find((b) => b.userId === userId && !b.endedAt) ?? null
      );
    },

    reset(): void {
      this.breaks = [];
    },
  };
}

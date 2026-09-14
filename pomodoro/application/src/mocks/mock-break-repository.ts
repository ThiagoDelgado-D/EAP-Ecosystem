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

    async update(updatedBreak: Break): Promise<Break> {
      const index = this.breaks.findIndex((b) => b.id === updatedBreak.id);
      if (index === -1) {
        this.breaks.push(updatedBreak);
      } else {
        this.breaks[index] = updatedBreak;
      }
      return updatedBreak;
    },

    async findById(breakId: UUID): Promise<Break | null> {
      return this.breaks.find((b) => b.id === breakId) ?? null;
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

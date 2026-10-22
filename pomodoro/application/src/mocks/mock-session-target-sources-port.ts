import type { UUID } from "domain-lib";
import type { SessionTargetSourcesPort } from "@pomodoro/domain";

export interface MockedSessionTargetSourcesPort extends SessionTargetSourcesPort {
  usersWithoutPathSteps: Set<UUID>;
  reset(): void;
}

export function mockSessionTargetSourcesPort(): MockedSessionTargetSourcesPort {
  return {
    usersWithoutPathSteps: new Set<UUID>(),

    allowsPathSteps(userId: UUID): Promise<boolean> {
      return Promise.resolve(!this.usersWithoutPathSteps.has(userId));
    },

    reset(): void {
      this.usersWithoutPathSteps.clear();
    },
  };
}

import { DomainNotificationType } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { mockNotificationPort } from "../../mocks/index.js";
import { DEFAULT_BREAK_DURATION_SEC, startBreak } from "./start-break.js";

describe("startBreak", () => {
  let notificationPort: ReturnType<typeof mockNotificationPort>;

  beforeEach(() => {
    notificationPort = mockNotificationPort();
  });

  test("Should notify that a break started with the default duration", async () => {
    await startBreak({ notificationPort });

    expect(notificationPort.notifications).toHaveLength(1);
    const [notification] = notificationPort.notifications;
    expect(notification!.type).toBe(DomainNotificationType.BREAK_STARTED);
    expect(notification!.body).toContain(
      `${DEFAULT_BREAK_DURATION_SEC / 60}`,
    );
  });
});

import {
  DomainNotificationType,
  type NotificationPort,
} from "@pomodoro/domain";

export const DEFAULT_BREAK_DURATION_SEC = 300;

export interface StartBreakDependencies {
  notificationPort: NotificationPort;
}

export const startBreak = async ({
  notificationPort,
}: StartBreakDependencies): Promise<void> => {
  const minutes = Math.round(DEFAULT_BREAK_DURATION_SEC / 60);
  await notificationPort.notify({
    type: DomainNotificationType.BREAK_STARTED,
    title: "Break started",
    body: `Take a ${minutes} min break.`,
    occurredAt: new Date(),
  });
};

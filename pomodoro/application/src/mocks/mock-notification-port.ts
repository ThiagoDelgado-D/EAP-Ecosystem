import type { DomainNotification, NotificationPort } from "@pomodoro/domain";

export interface MockedNotificationPort extends NotificationPort {
  notifications: DomainNotification[];
  reset(): void;
}

export function mockNotificationPort(): MockedNotificationPort {
  return {
    notifications: [],

    async notify(event: DomainNotification): Promise<void> {
      this.notifications.push(event);
    },

    reset(): void {
      this.notifications = [];
    },
  };
}

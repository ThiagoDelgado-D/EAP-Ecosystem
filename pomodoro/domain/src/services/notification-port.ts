export const DomainNotificationType = {
  SESSION_COMPLETED: "session.completed",
  BREAK_STARTED: "break.started",
} as const;

export type DomainNotificationType =
  (typeof DomainNotificationType)[keyof typeof DomainNotificationType];

export interface DomainNotification {
  type: DomainNotificationType;
  title: string;
  body: string;
  occurredAt: Date;
}

export interface NotificationPort {
  notify(event: DomainNotification): Promise<void>;
}

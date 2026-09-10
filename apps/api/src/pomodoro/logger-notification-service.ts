import { Logger } from "@nestjs/common";
import type { DomainNotification, NotificationPort } from "@pomodoro/domain";

export class LoggerNotificationService implements NotificationPort {
  private readonly logger = new Logger(LoggerNotificationService.name);

  async notify(event: DomainNotification): Promise<void> {
    this.logger.log(`[DEV] [${event.type}] ${event.title}: ${event.body}`);
  }
}

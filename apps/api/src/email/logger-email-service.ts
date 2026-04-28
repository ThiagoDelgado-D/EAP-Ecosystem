import { Logger } from "@nestjs/common";
import type {
  BasicSendEmailOptions,
  EmailService,
  TemplateSendEmailOptions,
} from "domain-lib";

export class LoggerEmailService implements EmailService {
  private readonly logger = new Logger(LoggerEmailService.name);

  async sendEmail(opts: BasicSendEmailOptions): Promise<void> {
    this.logger.log(`[DEV] Email to ${opts.to?.join(", ")}: ${opts.subject}`);
  }

  async sendTemplateEmail(
    opts: TemplateSendEmailOptions<string>,
  ): Promise<void> {
    this.logger.log(
      `[DEV] Template: ${opts.template} → ${JSON.stringify(opts.data)}`,
    );
  }
}

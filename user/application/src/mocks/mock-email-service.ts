import {
  DefaultEmailTemplates,
  ms,
  type BasicSendEmailOptions,
  type EmailService,
  type TemplateSendEmailOptions,
} from "domain-lib";

export class MockedEmailService implements EmailService<DefaultEmailTemplates> {
  public sentEmails: Array<
    BasicSendEmailOptions | TemplateSendEmailOptions<DefaultEmailTemplates>
  > = [];

  async sendEmail(opts: BasicSendEmailOptions): Promise<void> {
    await ms?.(10);
    this.sentEmails.push(opts);
  }

  async sendTemplateEmail(
    opts: TemplateSendEmailOptions<DefaultEmailTemplates>,
  ): Promise<void> {
    await ms?.(10);
    this.sentEmails.push(opts);
  }

  getLastEmail(): (typeof this.sentEmails)[0] | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  hasTemplateEmail(template: DefaultEmailTemplates): boolean {
    return this.sentEmails.some(
      (email) => "template" in email && email.template === template,
    );
  }

  reset(): void {
    this.sentEmails = [];
  }

  clear(): void {
    this.sentEmails = [];
  }
}

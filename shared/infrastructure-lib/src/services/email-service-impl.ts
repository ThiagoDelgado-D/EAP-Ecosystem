import nodemailer from "nodemailer";
import type {
  EmailService,
  BasicSendEmailOptions,
  TemplateSendEmailOptions,
  DefaultEmailTemplates,
} from "domain-lib";

export class EmailServiceImpl implements EmailService<DefaultEmailTemplates> {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(opts: BasicSendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: opts.to,
      cc: opts.cc,
      bcc: opts.bcc,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments?.map((att) => ({
        filename: att.filename,
        path: att.url,
        contentType: att.mimetype,
      })),
    });
  }

  async sendTemplateEmail(
    opts: TemplateSendEmailOptions<DefaultEmailTemplates>,
  ): Promise<void> {
    const templates: Record<
      DefaultEmailTemplates,
      { subject: string; html: string }
    > = {
      EMAIL_VERIFICATION: {
        subject: "Verify your email",
        html: `<p>Click here to verify: ${opts.data.verificationLink}</p>`,
      },
      WELCOME: {
        subject: "Welcome!",
        html: `<p>Welcome ${opts.data.name}!</p>`,
      },
      PASSWORD_RESET: {
        subject: "Reset your password",
        html: `<p>Reset link: ${opts.data.resetLink}</p>`,
      },
    };

    const template = templates[opts.template];
    if (!template) throw new Error(`Template ${opts.template} not found`);

    await this.sendEmail({
      ...opts,
      subject: template.subject,
      html: template.html,
    });
  }
}

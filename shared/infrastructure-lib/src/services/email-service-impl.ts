import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import handlebars from "handlebars";
import type {
  EmailService,
  BasicSendEmailOptions,
  TemplateSendEmailOptions,
} from "domain-lib";

export interface EmailTemplateDeclaration {
  fileName: string;
  subject: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
  tls?: { rejectUnauthorized?: boolean };
}

export class MissingTemplateError extends Error {
  constructor(templateName: string, filePath: string) {
    super(
      `[EmailService] Template "${templateName}" declared but .hbs file not found: ${filePath}`,
    );
    this.name = "MissingTemplateError";
  }
}

type CompiledEntry = {
  subject: string;
  render: ReturnType<typeof handlebars.compile>;
};

export class EmailServiceImpl implements EmailService<string> {
  private readonly transporter: nodemailer.Transporter;
  private readonly compiled = new Map<string, CompiledEntry>();
  private readonly defaultFrom: string;

  /**
   * @param templateDir   Absolute path to the folder containing .hbs files.
   *                      Resolved by the caller (UserModule) — avoids ESM
   *                      __dirname issues inside the library.
   * @param declarations  Map of template name → { fileName, subject }.
   *                      Every declared template must have a corresponding
   *                      .hbs file — the constructor throws MissingTemplateError
   *                      at startup if any file is absent (fail-fast).
   * @param smtp          Resolved SMTP config. The factory in UserModule is
   *                      responsible for choosing between real SMTP and Ethereal.
   */
  constructor(
    templateDir: string,
    declarations: Record<string, EmailTemplateDeclaration>,
    smtp: SmtpConfig,
  ) {
    for (const [name, decl] of Object.entries(declarations)) {
      const filePath = path.join(templateDir, decl.fileName);
      if (!fs.existsSync(filePath)) {
        throw new MissingTemplateError(name, filePath);
      }
      const source = fs.readFileSync(filePath, "utf-8");
      this.compiled.set(name, {
        subject: decl.subject,
        render: handlebars.compile(source),
      });
    }

    handlebars.registerHelper("year", () => new Date().getFullYear());

    this.defaultFrom = smtp.from ?? `noreply@${smtp.host}`;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
      tls: smtp.tls,
    });
  }

  async sendEmail(opts: BasicSendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.defaultFrom,
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
    opts: TemplateSendEmailOptions<string>,
  ): Promise<void> {
    const entry = this.compiled.get(opts.template);
    if (!entry) {
      throw new Error(
        `[EmailService] Template "${opts.template}" is not registered. ` +
          `Declare it in EAP_EMAIL_DECLARATIONS and add the corresponding .hbs file.`,
      );
    }
    await this.sendEmail({
      ...opts,
      subject: entry.subject,
      html: entry.render(opts.data),
    });
  }
}

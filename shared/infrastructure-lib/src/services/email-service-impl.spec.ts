import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import nodemailer from "nodemailer";
import {
  EmailServiceImpl,
  MissingTemplateError,
  type SmtpConfig,
} from "./email-service-impl.js";

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn() },
}));

const PRODUCT_NAME = "Cauce";
const LEARNER_EMAIL = "learner@example.com";
const LEARNER_FIRST_NAME = "Ada";
const WELCOME_TEMPLATE = "WELCOME";
const WELCOME_FILE = "welcome.hbs";
const WELCOME_SUBJECT = "Welcome to {{productName}}";
const WELCOME_BODY = "<p>Hi {{firstName}}, {{productName}} © {{year}}</p>";

const SMTP: SmtpConfig = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: { user: "mailer", pass: "secret" },
};

describe("EmailServiceImpl", () => {
  const sendMail = vi.fn();
  let templateDir: string;

  beforeEach(async () => {
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
    templateDir = await mkdtemp(join(tmpdir(), "email-service-test-"));
    await writeFile(join(templateDir, WELCOME_FILE), WELCOME_BODY);
  });

  afterEach(async () => {
    sendMail.mockReset();
    await rm(templateDir, { recursive: true, force: true });
  });

  const createService = () =>
    new EmailServiceImpl(
      templateDir,
      {
        [WELCOME_TEMPLATE]: {
          fileName: WELCOME_FILE,
          subject: WELCOME_SUBJECT,
        },
      },
      SMTP,
      { productName: PRODUCT_NAME },
    );

  test("renders globals into the subject", async () => {
    await createService().sendTemplateEmail({
      to: [LEARNER_EMAIL],
      template: WELCOME_TEMPLATE,
      data: { firstName: LEARNER_FIRST_NAME },
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: `Welcome to ${PRODUCT_NAME}` }),
    );
  });

  test("renders globals, per-email data and the year into the body", async () => {
    await createService().sendTemplateEmail({
      to: [LEARNER_EMAIL],
      template: WELCOME_TEMPLATE,
      data: { firstName: LEARNER_FIRST_NAME },
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: `<p>Hi ${LEARNER_FIRST_NAME}, ${PRODUCT_NAME} © ${new Date().getFullYear()}</p>`,
      }),
    );
  });

  test("throws at construction when a declared template file is missing", () => {
    const missingFile = "missing.hbs";

    expect(
      () =>
        new EmailServiceImpl(
          templateDir,
          {
            [WELCOME_TEMPLATE]: {
              fileName: missingFile,
              subject: WELCOME_SUBJECT,
            },
          },
          SMTP,
        ),
    ).toThrow(MissingTemplateError);
  });
});

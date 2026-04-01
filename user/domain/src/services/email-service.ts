import {
  DefaultEmailTemplates,
  type EmailService as DefaultEmailService,
} from "domain-lib";

export const EmailTemplates = {
  ...DefaultEmailTemplates,
  USER_REGISTERED: "USER_REGISTERED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
} as const;

export type EmailTemplates = keyof typeof EmailTemplates;

export type EmailService = DefaultEmailService<EmailTemplates>;

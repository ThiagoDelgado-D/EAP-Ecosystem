import type { EmailTemplateDeclaration } from "infrastructure-lib";

/**
 * Declares the email templates used by EAP.
 *
 * Every entry must have a matching .hbs file in apps/api/src/emails/.
 * EmailServiceImpl will throw MissingTemplateError at startup if any
 * declared template is missing its file — intentional fail-fast behaviour.
 *
 * To add a new template:
 *   1. Add an entry here.
 *   2. Create the corresponding .hbs file in apps/api/src/emails/.
 *   3. That's it — the service picks it up on next start.
 */
export const EAP_EMAIL_DECLARATIONS: Record<string, EmailTemplateDeclaration> =
  {
    MAGIC_LINK_CODE: {
      fileName: "magic-link-code.hbs",
      subject: "Your EAP sign-in code",
    },
    WELCOME: {
      fileName: "welcome.hbs",
      subject: "Welcome to EAP",
    },
  };

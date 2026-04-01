export interface SendEmailAttachment {
    filename: string;
    url: string;
    mimetype?: string;
}

export interface CommonSendEmailOptions {
    replyTo?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    attachments?: SendEmailAttachment[];
}

export interface BasicSendEmailOptions extends CommonSendEmailOptions {
    html: string;
    subject: string;
}

export interface TemplateSendEmailOptions<TTemplateName extends string> extends CommonSendEmailOptions {
    template: TTemplateName;
    data: Record<string, any>;
}

export interface EmailService<TTemplateName extends string = DefaultEmailTemplates> {
    sendEmail(opts: BasicSendEmailOptions): Promise<void>;
    sendTemplateEmail(opts: TemplateSendEmailOptions<TTemplateName>): Promise<void>;
}

export const DefaultEmailTemplates = {
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
    WELCOME: "WELCOME",
    PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type DefaultEmailTemplates = keyof typeof DefaultEmailTemplates;

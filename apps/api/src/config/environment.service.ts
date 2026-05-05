import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  private readonly _jwtSecret: string;
  private readonly _jwtExpiresInSeconds: number;
  private readonly _corsOrigin: string;
  private readonly _webHost: string;
  private readonly _nodeEnv: string;
  private readonly _smtpHost: string;
  private readonly _smtpPort: number;
  private readonly _smtpSecure: boolean;
  private readonly _smtpUser: string;
  private readonly _smtpPass: string;
  private readonly _smtpFrom: string;
  private readonly _smtpSkipCertVerify: boolean;
  private readonly _googleClientId: string;
  private readonly _googleClientSecret: string;
  private readonly _googleRedirectUrl: string;

  constructor(private readonly configService: ConfigService) {
    this._jwtSecret = this.readVar("JWT_SECRET");
    if (!this._jwtSecret) {
      throw new Error("Missing required environment variable: JWT_SECRET");
    }
    this._jwtExpiresInSeconds = this.parseDuration(
      this.readVar("JWT_EXPIRES_IN", "15m"),
    );
    this._corsOrigin = this.readVar("CORS_ORIGIN", "http://localhost:4200");
    this._webHost = this.readVar("WEB_HOST", "http://localhost:4200");
    this._nodeEnv = this.readVar("NODE_ENV", "development");
    this._smtpHost = this.readVar("SMTP_HOST");
    this._smtpPort = parseInt(this.readVar("SMTP_PORT", "587"), 10);
    this._smtpSecure = this.parseBoolean(this.readVar("SMTP_SECURE", "false"));
    this._smtpUser = this.readVar("SMTP_USER");
    this._smtpPass = this.readVar("SMTP_PASS");
    this._smtpFrom = this.readVar("SMTP_FROM");
    this._smtpSkipCertVerify = this.parseBoolean(
      this.readVar("SMTP_SKIP_CERT_VERIFY", "false"),
    );
    this._googleClientId = this.readVar("GOOGLE_CLIENT_ID");
    this._googleClientSecret = this.readVar("GOOGLE_CLIENT_SECRET");
    this._googleRedirectUrl = this.readVar(
      "GOOGLE_REDIRECT_URI",
      "http://localhost:3000/api/v1/auth/google/callback",
    );
  }

  get jwtSecret(): string {
    return this._jwtSecret;
  }

  get jwtExpiresInSeconds(): number {
    return this._jwtExpiresInSeconds;
  }

  get corsOrigin(): string {
    return this._corsOrigin;
  }

  get webHost(): string {
    return this._webHost;
  }

  get nodeEnv(): string {
    return this._nodeEnv;
  }

  get isProduction(): boolean {
    return this._nodeEnv === "production";
  }

  get smtpHost(): string {
    return this._smtpHost;
  }

  get smtpPort(): number {
    return this._smtpPort;
  }

  get smtpSecure(): boolean {
    return this._smtpSecure;
  }

  get smtpUser(): string {
    return this._smtpUser;
  }

  get smtpPass(): string {
    return this._smtpPass;
  }

  get smtpFrom(): string {
    return this._smtpFrom;
  }

  get smtpSkipCertVerify(): boolean {
    return this._smtpSkipCertVerify;
  }

  get googleClientId(): string {
    return this._googleClientId;
  }

  get googleClientSecret(): string {
    return this._googleClientSecret;
  }

  get googleRedirectUri(): string {
    return this._googleRedirectUrl;
  }

  private readVar(key: string, fallback?: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      if (fallback !== undefined) return fallback;
      this.logger.warn("Missing environment variable: " + key);
      return "";
    }
    return value;
  }

  /**
   * Parses duration strings like "15m", "1h", "7d", "900s" into seconds.
   * Falls back to 900 (15 minutes) for unrecognised formats.
   */
  private parseDuration(value: string): number {
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = value.match(/^(\d+)([smhd])$/);
    if (match) {
      return parseInt(match[1], 10) * (units[match[2]] ?? 1);
    }
    if (!/^\d+$/.test(value)) {
      return 900;
    }
    const numeric = parseInt(value, 10);
    return isNaN(numeric) ? 900 : numeric;
  }

  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === "true";
  }
}

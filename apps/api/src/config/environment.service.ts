import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);

  private readonly _jwtSecret: string;
  private readonly _jwtExpiresInSeconds: number;
  private readonly _corsOrigin: string;
  private readonly _webHost: string;
  private readonly _smtpHost: string;
  private readonly _smtpPort: number;
  private readonly _smtpUser: string;
  private readonly _smtpPass: string;
  private readonly _smtpFrom: string;

  constructor(private readonly configService: ConfigService) {
    this._jwtSecret = this.readVar("JWT_SECRET");
    this._jwtExpiresInSeconds = this.parseDuration(
      this.readVar("JWT_EXPIRES_IN", "15m"),
    );
    this._corsOrigin = this.readVar("CORS_ORIGIN", "http://localhost:4200");
    this._webHost = this.readVar("WEB_HOST", "http://localhost:4200");
    this._smtpHost = this.readVar("SMTP_HOST");
    this._smtpPort = parseInt(this.readVar("SMTP_PORT", "587"), 10);
    this._smtpUser = this.readVar("SMTP_USER");
    this._smtpPass = this.readVar("SMTP_PASS");
    this._smtpFrom = this.readVar("SMTP_FROM");
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

  get smtpHost(): string {
    return this._smtpHost;
  }

  get smtpPort(): number {
    return this._smtpPort;
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
    const numeric = parseInt(value, 10);
    return isNaN(numeric) ? 900 : numeric;
  }
}

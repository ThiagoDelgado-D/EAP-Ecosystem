import { sign, verify } from "jsonwebtoken";
import type { JwtPayload, JwtService } from "domain-lib";

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
}

export class JwtServiceImpl implements JwtService {
  constructor(private readonly config: JwtConfig) {}

  async sign(payload: JwtPayload): Promise<string> {
    return sign({ ...payload }, this.config.secret, {
      expiresIn: this.config.expiresInSeconds,
    });
  }

  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = verify(token, this.config.secret);
      if (typeof decoded === "string") return null;
      return decoded as JwtPayload;
    } catch {
      return null;
    }
  }
}

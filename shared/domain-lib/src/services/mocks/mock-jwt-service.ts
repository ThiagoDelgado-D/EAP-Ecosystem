import type { JwtPayload, JwtService } from "../jwt-service.js";
import { ms } from "../../utils/ms.js";

export interface MockedJwtService extends JwtService {
  issuedTokens: string[];
  lastPayload: JwtPayload | null;
  reset(): void;
}

export function mockJwtService(): MockedJwtService {
  return {
    issuedTokens: [],
    lastPayload: null,

    async sign(payload: JwtPayload): Promise<string> {
      await ms(10);
      const token =
        "mock-jwt." + Buffer.from(JSON.stringify(payload)).toString("base64");
      this.issuedTokens.push(token);
      this.lastPayload = payload;
      return token;
    },

    async verify(token: string): Promise<JwtPayload | null> {
      await ms(10);
      if (!token.startsWith("mock-jwt.")) return null;
      try {
        const raw = token.slice("mock-jwt.".length);
        return JSON.parse(
          Buffer.from(raw, "base64").toString("utf8"),
        ) as JwtPayload;
      } catch {
        return null;
      }
    },

    reset(): void {
      this.issuedTokens = [];
      this.lastPayload = null;
    },
  };
}

import type { UUID } from "../../types/index.js";
import { ms } from "../../utils/ms.js";
import type { CryptoService } from "../crypto-service.js";

export function mockCryptoService(): CryptoService {
  return {
    async hashPassword(pass: string) {
      await ms(100);
      return "[HASHED]" + pass;
    },
    async comparePassword(pass: string, hashPass: string) {
      await ms(100);
      return "[HASHED]" + pass == hashPass ? true : false;
    },
    async generateRandomToken(): Promise<string> {
      await ms(50);
      const char =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let token = "";

      for (let i = 0; i < 10; i++) {
        const rIndex = Math.floor(Math.random() * char.length);
        const randomChar = char[rIndex];
        token += randomChar;
      }

      return token;
    },
    async generateUUID(): Promise<UUID> {
      await ms(50);
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      ) as UUID;
    },
  };
}

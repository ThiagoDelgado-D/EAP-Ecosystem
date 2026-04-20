import type { CryptoService } from "domain-lib";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";

export class CryptoServiceImpl implements CryptoService {
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashPass: string) {
    return bcrypt.compare(password, hashPass);
  }

  async hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  async generateUUID() {
    return crypto.randomUUID();
  }

  async generateRandomToken() {
    return randomBytes(32).toString("hex");
  }

  async generateNumericCode(length: number): Promise<string> {
    const max = Math.pow(10, length);
    const min = Math.pow(10, length - 1);
    return String(randomInt(min, max));
  }
}

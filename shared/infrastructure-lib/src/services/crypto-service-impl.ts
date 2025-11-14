import type { CryptoService } from "domain-lib";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export class CryptoServiceImpl implements CryptoService {
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashPass: string) {
    return bcrypt.compare(password, hashPass);
  }

  async generateUUID() {
    return crypto.randomUUID();
  }

  async generateRandomToken() {
    return randomBytes(32).toString("hex");
  }
}

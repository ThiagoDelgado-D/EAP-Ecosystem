import type { UUID } from "../types/uuid.js";

export interface CryptoService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashPass: string): Promise<boolean>;
  /** Deterministic SHA-256 hash — use for token lookup keys, not passwords. */
  hashToken(token: string): Promise<string>;
  generateUUID(): Promise<UUID>;
  generateRandomToken(): Promise<string>;
  generateNumericCode(length: number): Promise<string>;
}

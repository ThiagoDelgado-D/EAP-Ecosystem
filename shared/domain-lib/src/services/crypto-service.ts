import type { UUID } from "../types/uuid.js";

export interface CryptoService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashPass: string): Promise<boolean>;
  generateUUID(): Promise<UUID>;
  generateRandomToken(): Promise<string>;
}

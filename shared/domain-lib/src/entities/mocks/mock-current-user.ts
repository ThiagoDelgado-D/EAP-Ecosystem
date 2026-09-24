import type { CryptoService } from "../../services/crypto-service.js";
import type { CurrentUser } from "../current-user.js";

export async function mockCurrentUser(
  crypto: CryptoService,
  opts?: Partial<CurrentUser>,
): Promise<CurrentUser> {
  return {
    id: await crypto.generateUUID(),
    ...opts,
  };
}

import type { ISessionRepository } from "@user/domain";
import type { CryptoService } from "domain-lib";

export interface SignOutDependencies {
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
}

export interface SignOutRequestModel {
  rawRefreshToken: string;
}

/**
 * Revokes the session associated with the given refresh token.
 * Silently succeeds even if the session is not found or already revoked
 * to avoid leaking session existence to callers.
 */
export const signOut = async (
  { sessionRepository, cryptoService }: SignOutDependencies,
  request: SignOutRequestModel,
): Promise<void> => {
  const hash = await cryptoService.hashToken(request.rawRefreshToken);
  const session = await sessionRepository.findByRefreshTokenHash(hash);
  if (session) {
    await sessionRepository.revoke(session.id);
  }
};

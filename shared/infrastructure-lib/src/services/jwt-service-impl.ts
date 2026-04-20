import type { JwtPayload, JwtService } from "domain-lib";

export class JwtServiceImpl implements JwtService {
  async sign(_payload: JwtPayload): Promise<string> {
    throw new Error(
      "JwtServiceImpl.sign() is not yet implemented — wire in v0.8.1",
    );
  }

  async verify(_token: string): Promise<JwtPayload | null> {
    throw new Error(
      "JwtServiceImpl.verify() is not yet implemented — wire in v0.8.1",
    );
  }
}

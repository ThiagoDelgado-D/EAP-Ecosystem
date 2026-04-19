export interface JwtPayload {
  sub: string;
  [key: string]: unknown;
}

export interface JwtService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload | null>;
}

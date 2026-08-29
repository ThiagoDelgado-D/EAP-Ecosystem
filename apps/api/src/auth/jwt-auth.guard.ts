import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { JwtService, UUID } from "domain-lib";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject("IJwtService") private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException();

    const token = authHeader.slice(7);
    const payload = await this.jwtService.verify(token);
    if (!payload?.sub) throw new UnauthorizedException();

    req.userId = payload.sub as UUID;
    return true;
  }
}

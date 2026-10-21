import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("ADMIN_API_TOKEN");
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const supplied = request.headers["x-admin-token"]
      ?? (authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined);

    if (!expected || typeof supplied !== "string") {
      throw new UnauthorizedException("Admin API token is not configured or missing");
    }
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      throw new UnauthorizedException("Invalid admin API token");
    }
    return true;
  }
}

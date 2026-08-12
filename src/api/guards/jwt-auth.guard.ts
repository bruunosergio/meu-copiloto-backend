import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_PROVIDER, TokenPort } from '../../domain/ports/output';

export interface RequestUser {
  sub: string;
  storeId: string;
  papel: string;
}

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenPort) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      const payload = this.tokenProvider.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso invalido ou expirado.');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

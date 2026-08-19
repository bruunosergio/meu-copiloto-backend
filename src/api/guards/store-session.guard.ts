import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_PROVIDER, TokenPort } from '../../domain/ports/output';

export interface StoreSession {
  storeId: string;
}

declare module 'express' {
  interface Request {
    storeSession?: StoreSession;
  }
}

/**
 * Guarda o token de sessao do terminal da loja (Store.codigo+senha).
 * Usado apenas nas duas rotas do fluxo do vendedor (listar vendedores e
 * confirmar o PIN) - ver ADR-0007. Nunca aceita um token de usuario comum.
 */
@Injectable()
export class StoreSessionGuard implements CanActivate {
  constructor(@Inject(TOKEN_PROVIDER) private readonly tokenProvider: TokenPort) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token da sessao da loja ausente.');
    }

    try {
      const payload = this.tokenProvider.verify(token);
      if (payload.papel !== 'LOJA') {
        throw new UnauthorizedException('Este token nao pertence a uma sessao de loja.');
      }
      request.storeSession = { storeId: payload.storeId };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token da sessao da loja invalido ou expirado.');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

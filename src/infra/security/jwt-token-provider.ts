import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions, TokenPayload, TokenPort } from '../../domain/ports/output';

@Injectable()
export class JwtTokenProvider implements TokenPort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload, options?: SignOptions): string {
    return this.jwtService.sign(payload, options?.expiresIn ? { expiresIn: options.expiresIn } : undefined);
  }

  verify(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token);
  }
}

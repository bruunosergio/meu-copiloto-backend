import { Role } from '../../entities';

export interface TokenPayload {
  sub: string;
  storeId: string;
  papel: Role;
}

export interface TokenPort {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}

export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

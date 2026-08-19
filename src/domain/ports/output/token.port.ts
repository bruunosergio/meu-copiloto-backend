import { Role } from '../../entities';

/**
 * 'LOJA' identifica uma sessao de terminal (Store.codigo+senha), nao um usuario.
 * Esse token so serve para listar vendedores e abrir a sessao de um deles
 * (ver StoreSessionGuard) - nunca acessa rotas de negocio diretamente.
 */
export type TokenScope = Role | 'LOJA';

export interface TokenPayload {
  sub: string;
  storeId: string;
  papel: TokenScope;
}

export interface SignOptions {
  /** Sobrescreve o expiresIn padrao (ex.: sessao de loja dura mais que a de vendedor). */
  expiresIn?: string;
}

export interface TokenPort {
  sign(payload: TokenPayload, options?: SignOptions): string;
  verify(token: string): TokenPayload;
}

export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

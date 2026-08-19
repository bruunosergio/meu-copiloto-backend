import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { User } from '../../entities';

export interface LoginInput {
  storeId: string;
  email: string;
  senha: string;
}

export interface LoginOutput {
  token: string;
  user: User;
}

export interface StoreLoginInput {
  codigo: string;
  senha: string;
}

export interface StoreLoginOutput {
  storeToken: string;
  store: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface VendedorSummary {
  id: string;
  nome: string;
}

export interface VendedorLoginInput {
  storeId: string;
  userId: string;
  pin: string;
}

/**
 * Auth tem dois fluxos independentes (ver ADR-0007):
 * - `login`: ADMIN/COMPRADOR, e-mail+senha, de qualquer lugar.
 * - `loginStore` -> `listVendedoresParaLogin` -> `loginVendedor`: terminal
 *   compartilhado da loja (codigo+senha) e o vendedor se identifica na lista + PIN.
 */
export interface AuthUseCase {
  login(input: LoginInput): Promise<Result<LoginOutput, Failure>>;
  loginStore(input: StoreLoginInput): Promise<Result<StoreLoginOutput, Failure>>;
  listVendedoresParaLogin(storeId: string): Promise<Result<VendedorSummary[], Failure>>;
  loginVendedor(input: VendedorLoginInput): Promise<Result<LoginOutput, Failure>>;
}

export const AUTH_USE_CASE = 'AUTH_USE_CASE';

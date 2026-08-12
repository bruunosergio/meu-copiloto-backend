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

export interface AuthUseCase {
  login(input: LoginInput): Promise<Result<LoginOutput, Failure>>;
}

export const AUTH_USE_CASE = 'AUTH_USE_CASE';

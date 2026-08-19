import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { Role, User } from '../../entities';

export interface CreateUserInput {
  storeId: string;
  nome: string;
  papel: Role;
  /** ADMIN/COMPRADOR (obrigatorios para esses papeis). */
  email?: string;
  senha?: string;
  /** VENDEDOR (obrigatorios para esse papel). */
  usuario?: string;
  pin?: string;
  telefoneWhatsapp: string | null;
}

export interface UpdateUserInput {
  nome?: string;
  email?: string;
  senha?: string;
  usuario?: string;
  pin?: string;
  telefoneWhatsapp?: string | null;
  papel?: Role;
  ativo?: boolean;
}

export interface UserManagementUseCase {
  create(input: CreateUserInput): Promise<Result<User, Failure>>;
  update(id: string, input: UpdateUserInput): Promise<Result<User, Failure>>;
  deactivate(id: string): Promise<Result<User, Failure>>;
  getById(id: string): Promise<Result<User, Failure>>;
  listByStore(storeId: string): Promise<Result<User[], Failure>>;
}

export const USER_MANAGEMENT_USE_CASE = 'USER_MANAGEMENT_USE_CASE';

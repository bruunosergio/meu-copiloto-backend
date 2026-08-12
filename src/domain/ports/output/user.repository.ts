import { User } from '../../entities';

export interface CreateUserData {
  storeId: string;
  nome: string;
  email: string;
  senhaHash: string;
  telefoneWhatsapp: string | null;
  papel: User['papel'];
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
  senhaHash?: string;
  telefoneWhatsapp?: string | null;
  papel?: User['papel'];
  ativo?: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(storeId: string, email: string): Promise<User | null>;
  findByPhone(telefoneWhatsapp: string): Promise<User | null>;
  listByStore(storeId: string): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';

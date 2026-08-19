import { CreateUserData, UpdateUserData, UserRepository } from '../../ports/output';
import { User } from '../../entities';

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];
  private nextId = 1;

  seed(user: User) {
    this.users.push(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(storeId: string, email: string): Promise<User | null> {
    return this.users.find((u) => u.storeId === storeId && u.email === email) ?? null;
  }

  async findByUsuario(storeId: string, usuario: string): Promise<User | null> {
    return this.users.find((u) => u.storeId === storeId && u.usuario === usuario) ?? null;
  }

  async findByPhone(telefoneWhatsapp: string): Promise<User | null> {
    return this.users.find((u) => u.telefoneWhatsapp === telefoneWhatsapp) ?? null;
  }

  async listByStore(storeId: string): Promise<User[]> {
    return this.users.filter((u) => u.storeId === storeId);
  }

  async create(data: CreateUserData): Promise<User> {
    // Prefixo distinto de ids usados via seed() (ex.: 'user-1') para nao colidir
    // quando um teste mistura usuarios semeados manualmente com criados via create().
    const user = new User({
      id: `user-auto-${this.nextId++}`,
      storeId: data.storeId,
      nome: data.nome,
      email: data.email,
      senhaHash: data.senhaHash,
      usuario: data.usuario,
      pinHash: data.pinHash,
      telefoneWhatsapp: data.telefoneWhatsapp,
      papel: data.papel,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Usuario nao encontrado no fake repository.');
    const atual = this.users[index];
    const atualizado = new User({
      id: atual.id,
      storeId: atual.storeId,
      nome: data.nome ?? atual.nome,
      email: data.email !== undefined ? data.email : atual.email,
      senhaHash: data.senhaHash !== undefined ? data.senhaHash : atual.senhaHash,
      usuario: data.usuario !== undefined ? data.usuario : atual.usuario,
      pinHash: data.pinHash !== undefined ? data.pinHash : atual.pinHash,
      telefoneWhatsapp:
        data.telefoneWhatsapp !== undefined ? data.telefoneWhatsapp : atual.telefoneWhatsapp,
      papel: data.papel ?? atual.papel,
      ativo: data.ativo !== undefined ? data.ativo : atual.ativo,
      criadoEm: atual.criadoEm,
      atualizadoEm: new Date(),
    });
    this.users[index] = atualizado;
    return atualizado;
  }
}

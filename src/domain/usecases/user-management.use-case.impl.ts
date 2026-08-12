import { Result } from '../core/result';
import { ConflictFailure, Failure, NotFoundFailure, UnexpectedFailure } from '../failures';
import {
  CreateUserInput,
  UpdateUserInput,
  UserManagementUseCase,
} from '../ports/input';
import { PasswordHasherPort, UserRepository } from '../ports/output';
import { User } from '../entities';

export class UserManagementUseCaseImpl implements UserManagementUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async create(input: CreateUserInput): Promise<Result<User, Failure>> {
    try {
      const existente = await this.userRepository.findByEmail(input.storeId, input.email);
      if (existente) {
        return Result.error(new ConflictFailure(`Ja existe um usuario com o e-mail ${input.email}.`));
      }

      if (input.telefoneWhatsapp) {
        const comMesmoTelefone = await this.userRepository.findByPhone(input.telefoneWhatsapp);
        if (comMesmoTelefone) {
          return Result.error(
            new ConflictFailure(`O telefone ${input.telefoneWhatsapp} ja esta vinculado a outro usuario.`),
          );
        }
      }

      const senhaHash = await this.passwordHasher.hash(input.senha);

      const user = await this.userRepository.create({
        storeId: input.storeId,
        nome: input.nome,
        email: input.email,
        senhaHash,
        telefoneWhatsapp: input.telefoneWhatsapp,
        papel: input.papel,
      });

      return Result.ok(user);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<Result<User, Failure>> {
    try {
      const existente = await this.userRepository.findById(id);
      if (!existente) {
        return Result.error(new NotFoundFailure('Usuario', id));
      }

      const senhaHash = input.senha ? await this.passwordHasher.hash(input.senha) : undefined;

      const atualizado = await this.userRepository.update(id, {
        nome: input.nome,
        email: input.email,
        senhaHash,
        telefoneWhatsapp: input.telefoneWhatsapp,
        papel: input.papel,
        ativo: input.ativo,
      });

      return Result.ok(atualizado);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async deactivate(id: string): Promise<Result<User, Failure>> {
    try {
      const existente = await this.userRepository.findById(id);
      if (!existente) {
        return Result.error(new NotFoundFailure('Usuario', id));
      }

      const atualizado = await this.userRepository.update(id, { ativo: false });
      return Result.ok(atualizado);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async getById(id: string): Promise<Result<User, Failure>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return Result.error(new NotFoundFailure('Usuario', id));
      }
      return Result.ok(user);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async listByStore(storeId: string): Promise<Result<User[], Failure>> {
    try {
      const users = await this.userRepository.listByStore(storeId);
      return Result.ok(users);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }
}

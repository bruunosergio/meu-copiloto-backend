import { Result } from '../core/result';
import { ConflictFailure, Failure, NotFoundFailure, UnexpectedFailure, ValidationFailure } from '../failures';
import {
  CreateUserInput,
  UpdateUserInput,
  UserManagementUseCase,
} from '../ports/input';
import { PasswordHasherPort, UserRepository } from '../ports/output';
import { User } from '../entities';

const USUARIO_REGEX = /^[a-z0-9._-]{3,20}$/;
const PIN_REGEX = /^\d{4,6}$/;

export class UserManagementUseCaseImpl implements UserManagementUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async create(input: CreateUserInput): Promise<Result<User, Failure>> {
    try {
      const validationError = this.validarCredenciais(input);
      if (validationError) {
        return Result.error(validationError);
      }

      const usuario = input.usuario!.toLowerCase();
      const existenteUsuario = await this.userRepository.findByUsuario(input.storeId, usuario);
      if (existenteUsuario) {
        return Result.error(
          new ConflictFailure(`Ja existe um usuario com o identificador "${usuario}" nesta loja.`),
        );
      }

      if (input.email) {
        const existenteEmail = await this.userRepository.findByEmail(input.storeId, input.email);
        if (existenteEmail) {
          return Result.error(new ConflictFailure(`Ja existe um usuario com o e-mail ${input.email}.`));
        }
      }

      if (input.telefoneWhatsapp) {
        const comMesmoTelefone = await this.userRepository.findByPhone(input.telefoneWhatsapp);
        if (comMesmoTelefone) {
          return Result.error(
            new ConflictFailure(`O telefone ${input.telefoneWhatsapp} ja esta vinculado a outro usuario.`),
          );
        }
      }

      const pinHash = await this.passwordHasher.hash(input.pin!);
      const senhaHash = input.senha ? await this.passwordHasher.hash(input.senha) : null;

      const user = await this.userRepository.create({
        storeId: input.storeId,
        nome: input.nome,
        email: input.email?.trim() ? input.email.trim() : null,
        senhaHash,
        usuario,
        pinHash,
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

      if (input.usuario !== undefined && !USUARIO_REGEX.test(input.usuario.toLowerCase())) {
        return Result.error(
          new ValidationFailure(
            'Usuario deve ter 3-20 caracteres: letras minusculas, numeros, ".", "_" ou "-".',
          ),
        );
      }
      if (input.pin !== undefined && !PIN_REGEX.test(input.pin)) {
        return Result.error(new ValidationFailure('PIN deve ter de 4 a 6 digitos numericos.'));
      }
      if (input.senha !== undefined && input.senha.length < 8) {
        return Result.error(new ValidationFailure('Senha deve ter ao menos 8 caracteres.'));
      }

      if (input.usuario !== undefined) {
        const usuarioNormalizado = input.usuario.toLowerCase();
        const comMesmoUsuario = await this.userRepository.findByUsuario(
          existente.storeId,
          usuarioNormalizado,
        );
        if (comMesmoUsuario && comMesmoUsuario.id !== id) {
          return Result.error(
            new ConflictFailure(
              `Ja existe um usuario com o identificador "${usuarioNormalizado}" nesta loja.`,
            ),
          );
        }
      }

      if (input.email !== undefined && input.email) {
        const comMesmoEmail = await this.userRepository.findByEmail(existente.storeId, input.email);
        if (comMesmoEmail && comMesmoEmail.id !== id) {
          return Result.error(new ConflictFailure(`Ja existe um usuario com o e-mail ${input.email}.`));
        }
      }

      const senhaHash = input.senha ? await this.passwordHasher.hash(input.senha) : undefined;
      const pinHash = input.pin ? await this.passwordHasher.hash(input.pin) : undefined;

      const atualizado = await this.userRepository.update(id, {
        nome: input.nome,
        email: input.email,
        senhaHash,
        usuario: input.usuario?.toLowerCase(),
        pinHash,
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

  /**
   * Todo papel entra pela porta da loja com usuario+PIN (ADR-0010).
   * E-mail/senha sao opcionais (ponte para contas antigas).
   */
  private validarCredenciais(
    input: Pick<CreateUserInput, 'usuario' | 'pin'>,
  ): ValidationFailure | null {
    if (!input.usuario || !USUARIO_REGEX.test(input.usuario.toLowerCase())) {
      return new ValidationFailure(
        'Usuario deve ter 3-20 caracteres: letras minusculas, numeros, ".", "_" ou "-".',
      );
    }
    if (!input.pin || !PIN_REGEX.test(input.pin)) {
      return new ValidationFailure('PIN deve ter de 4 a 6 digitos numericos.');
    }
    return null;
  }
}

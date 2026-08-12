import { Result } from '../core/result';
import { Failure, InvalidCredentialsFailure, UnexpectedFailure } from '../failures';
import {
  AuthUseCase,
  LoginInput,
  LoginOutput,
} from '../ports/input';
import { PasswordHasherPort, TokenPort, UserRepository } from '../ports/output';

/**
 * Classe pura de domínio: nenhum decorator/framework aqui.
 * A ligação das dependências concretas acontece em config/modules (composition root).
 */
export class AuthUseCaseImpl implements AuthUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenPort,
  ) {}

  async login(input: LoginInput): Promise<Result<LoginOutput, Failure>> {
    try {
      const user = await this.userRepository.findByEmail(input.storeId, input.email);

      if (!user || !user.ativo) {
        return Result.error(new InvalidCredentialsFailure());
      }

      const senhaValida = await this.passwordHasher.compare(input.senha, user.senhaHash);
      if (!senhaValida) {
        return Result.error(new InvalidCredentialsFailure());
      }

      const token = this.tokenProvider.sign({
        sub: user.id,
        storeId: user.storeId,
        papel: user.papel,
      });

      return Result.ok({ token, user });
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }
}

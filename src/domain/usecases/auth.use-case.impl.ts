import { Result } from '../core/result';
import { Failure, InvalidCredentialsFailure, UnexpectedFailure } from '../failures';
import {
  AuthUseCase,
  LoginInput,
  LoginOutput,
  StoreLoginInput,
  StoreLoginOutput,
  VendedorLoginInput,
  VendedorSummary,
} from '../ports/input';
import {
  PasswordHasherPort,
  StoreRepository,
  TokenPort,
  UserRepository,
} from '../ports/output';

export interface AuthTokenConfig {
  /** Duracao do token da sessao do terminal (fica aberta o turno todo). */
  storeTokenExpiresIn: string;
  /** Duracao do token do vendedor (curta de proposito - ver ADR-0007). */
  vendedorTokenExpiresIn: string;
}

/**
 * Classe pura de domínio: nenhum decorator/framework aqui.
 * A ligação das dependências concretas acontece em config/modules (composition root).
 */
export class AuthUseCaseImpl implements AuthUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly storeRepository: StoreRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenPort,
    private readonly tokenConfig: AuthTokenConfig,
  ) {}

  /** ADMIN/COMPRADOR: e-mail+senha, de qualquer lugar. */
  async login(input: LoginInput): Promise<Result<LoginOutput, Failure>> {
    try {
      const user = await this.userRepository.findByEmail(input.storeId, input.email);

      if (!user || !user.ativo) {
        return Result.error(new InvalidCredentialsFailure());
      }

      const senhaValida =
        !!user.senhaHash && (await this.passwordHasher.compare(input.senha, user.senhaHash));
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

  /** Passo 1 do fluxo do terminal: abre a sessao da loja. */
  async loginStore(input: StoreLoginInput): Promise<Result<StoreLoginOutput, Failure>> {
    try {
      const store = await this.storeRepository.findByCodigo(input.codigo);

      if (!store || !store.loginHabilitado()) {
        return Result.error(new InvalidCredentialsFailure('Codigo ou senha da loja invalidos.'));
      }

      const senhaValida = await this.passwordHasher.compare(input.senha, store.senhaHash!);
      if (!senhaValida) {
        return Result.error(new InvalidCredentialsFailure('Codigo ou senha da loja invalidos.'));
      }

      const storeToken = this.tokenProvider.sign(
        { sub: store.id, storeId: store.id, papel: 'LOJA' },
        { expiresIn: this.tokenConfig.storeTokenExpiresIn },
      );

      return Result.ok({
        storeToken,
        store: { id: store.id, nome: store.nome, codigo: store.codigo },
      });
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /** Passo 2: lista os vendedores ativos da loja para o terminal exibir. */
  async listVendedoresParaLogin(storeId: string): Promise<Result<VendedorSummary[], Failure>> {
    try {
      const users = await this.userRepository.listByStore(storeId);
      const vendedores = users
        .filter((user) => user.isVendedor() && user.ativo)
        .map((user) => ({ id: user.id, nome: user.nome }));
      return Result.ok(vendedores);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /** Passo 3: o vendedor escolhido confirma com o PIN e recebe um token curto. */
  async loginVendedor(input: VendedorLoginInput): Promise<Result<LoginOutput, Failure>> {
    try {
      const user = await this.userRepository.findById(input.userId);

      if (
        !user ||
        user.storeId !== input.storeId ||
        !user.isVendedor() ||
        !user.ativo ||
        !user.pinHash
      ) {
        return Result.error(new InvalidCredentialsFailure('PIN invalido.'));
      }

      const pinValido = await this.passwordHasher.compare(input.pin, user.pinHash);
      if (!pinValido) {
        return Result.error(new InvalidCredentialsFailure('PIN invalido.'));
      }

      const token = this.tokenProvider.sign(
        { sub: user.id, storeId: user.storeId, papel: user.papel },
        { expiresIn: this.tokenConfig.vendedorTokenExpiresIn },
      );

      return Result.ok({ token, user });
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }
}

import { AuthUseCaseImpl } from './auth.use-case.impl';
import { FakePasswordHasher, FakeTokenProvider, FakeUserRepository } from './__fakes__';
import { Role, User } from '../entities';
import { InvalidCredentialsFailure } from '../failures';

describe('AuthUseCaseImpl', () => {
  const storeId = 'store-1';
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenProvider: FakeTokenProvider;
  let useCase: AuthUseCaseImpl;

  beforeEach(async () => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenProvider = new FakeTokenProvider();
    useCase = new AuthUseCaseImpl(userRepository, passwordHasher, tokenProvider);

    userRepository.seed(
      new User({
        id: 'user-1',
        storeId,
        nome: 'Admin',
        email: 'admin@loja.com',
        senhaHash: await passwordHasher.hash('senha-correta'),
        telefoneWhatsapp: null,
        papel: Role.ADMIN,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }),
    );
  });

  it('autentica com credenciais corretas e devolve um token', async () => {
    const result = await useCase.login({ storeId, email: 'admin@loja.com', senha: 'senha-correta' });

    expect(result.isOk).toBe(true);
    expect(result.value.token).toBeDefined();
    expect(result.value.user.email).toBe('admin@loja.com');
  });

  it('rejeita senha incorreta', async () => {
    const result = await useCase.login({ storeId, email: 'admin@loja.com', senha: 'senha-errada' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
  });

  it('rejeita e-mail inexistente', async () => {
    const result = await useCase.login({ storeId, email: 'ninguem@loja.com', senha: 'qualquer' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
  });

  it('rejeita usuario inativo mesmo com senha correta', async () => {
    userRepository.seed(
      new User({
        id: 'user-2',
        storeId,
        nome: 'Inativo',
        email: 'inativo@loja.com',
        senhaHash: await passwordHasher.hash('senha-correta'),
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
        ativo: false,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }),
    );

    const result = await useCase.login({ storeId, email: 'inativo@loja.com', senha: 'senha-correta' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
  });
});

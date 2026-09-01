import { AuthUseCaseImpl } from './auth.use-case.impl';
import {
  FakePasswordHasher,
  FakeStoreRepository,
  FakeTokenProvider,
  FakeUserRepository,
} from './__fakes__';
import { Role, Store, User } from '../entities';
import { InvalidCredentialsFailure } from '../failures';

describe('AuthUseCaseImpl', () => {
  const storeId = 'store-1';
  let userRepository: FakeUserRepository;
  let storeRepository: FakeStoreRepository;
  let passwordHasher: FakePasswordHasher;
  let tokenProvider: FakeTokenProvider;
  let useCase: AuthUseCaseImpl;

  beforeEach(async () => {
    userRepository = new FakeUserRepository();
    storeRepository = new FakeStoreRepository();
    passwordHasher = new FakePasswordHasher();
    tokenProvider = new FakeTokenProvider();
    useCase = new AuthUseCaseImpl(userRepository, storeRepository, passwordHasher, tokenProvider, {
      storeTokenExpiresIn: '12h',
      vendedorTokenExpiresIn: '20m',
    });

    userRepository.seed(
      new User({
        id: 'user-1',
        storeId,
        nome: 'Admin',
        email: 'admin@loja.com',
        senhaHash: await passwordHasher.hash('senha-correta'),
        usuario: null,
        pinHash: null,
        telefoneWhatsapp: null,
        papel: Role.ADMIN,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }),
    );

    storeRepository.seed(
      new Store({
        id: storeId,
        codigo: 'loja-piloto',
        senhaHash: await passwordHasher.hash('senha-da-loja'),
        nome: 'Loja Piloto',
        segmento: 'AUTOPECAS',
        whatsappNumero: null,
        ativa: true,
        criadaEm: new Date(),
        atualizadaEm: new Date(),
      }),
    );
  });

  describe('login (ADMIN/COMPRADOR)', () => {
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
          usuario: null,
          pinHash: null,
          telefoneWhatsapp: null,
          papel: Role.COMPRADOR,
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

  describe('loginStore (terminal da loja)', () => {
    it('abre a sessao da loja com codigo+senha corretos', async () => {
      const result = await useCase.loginStore({ codigo: 'loja-piloto', senha: 'senha-da-loja' });

      expect(result.isOk).toBe(true);
      expect(result.value.storeToken).toBeDefined();
      expect(result.value.store.codigo).toBe('loja-piloto');
    });

    it('rejeita codigo inexistente', async () => {
      const result = await useCase.loginStore({ codigo: 'loja-fantasma', senha: 'qualquer' });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });

    it('rejeita senha da loja incorreta', async () => {
      const result = await useCase.loginStore({ codigo: 'loja-piloto', senha: 'senha-errada' });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });

    it('rejeita loja sem senha configurada', async () => {
      storeRepository.seed(
        new Store({
          id: 'store-2',
          codigo: 'loja-sem-senha',
          senhaHash: null,
          nome: 'Loja Sem Senha',
          segmento: 'AUTOPECAS',
          whatsappNumero: null,
          ativa: true,
          criadaEm: new Date(),
          atualizadaEm: new Date(),
        }),
      );

      const result = await useCase.loginStore({ codigo: 'loja-sem-senha', senha: 'qualquer' });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });
  });

  describe('listVendedoresParaLogin', () => {
    it('lista usuarios ativos com PIN, de qualquer papel', async () => {
      await userRepository.create({
        storeId,
        nome: 'Vendedor Ativo',
        email: null,
        senhaHash: null,
        usuario: 'vendedor.ativo',
        pinHash: await passwordHasher.hash('1234'),
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });
      await userRepository.create({
        storeId,
        nome: 'Gerente Ativo',
        email: null,
        senhaHash: null,
        usuario: 'gerente.ativo',
        pinHash: await passwordHasher.hash('4321'),
        telefoneWhatsapp: null,
        papel: Role.GERENTE,
      });
      const inativo = await userRepository.create({
        storeId,
        nome: 'Vendedor Inativo',
        email: null,
        senhaHash: null,
        usuario: 'vendedor.inativo',
        pinHash: await passwordHasher.hash('1234'),
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });
      await userRepository.update(inativo.id, { ativo: false });

      const result = await useCase.listVendedoresParaLogin(storeId);

      expect(result.isOk).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value.map((u) => u.nome).sort()).toEqual(['Gerente Ativo', 'Vendedor Ativo']);
    });
  });

  describe('loginVendedor', () => {
    let vendedorId: string;

    beforeEach(async () => {
      const vendedor = await userRepository.create({
        storeId,
        nome: 'Vendedor A',
        email: null,
        senhaHash: null,
        usuario: 'vendedor.a',
        pinHash: await passwordHasher.hash('1234'),
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });
      vendedorId = vendedor.id;
    });

    it('autentica com PIN correto', async () => {
      const result = await useCase.loginVendedor({ storeId, userId: vendedorId, pin: '1234' });

      expect(result.isOk).toBe(true);
      expect(result.value.token).toBeDefined();
      expect(result.value.user.usuario).toBe('vendedor.a');
    });

    it('rejeita PIN incorreto', async () => {
      const result = await useCase.loginVendedor({ storeId, userId: vendedorId, pin: '0000' });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });

    it('rejeita vendedor de outra loja', async () => {
      const result = await useCase.loginVendedor({
        storeId: 'outra-loja',
        userId: vendedorId,
        pin: '1234',
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });

    it('rejeita usuario sem PIN', async () => {
      const result = await useCase.loginVendedor({ storeId, userId: 'user-1', pin: 'qualquer' });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsFailure);
    });

    it('autentica gerente com PIN', async () => {
      const gerente = await userRepository.create({
        storeId,
        nome: 'Gerente A',
        email: null,
        senhaHash: null,
        usuario: 'gerente.a',
        pinHash: await passwordHasher.hash('9876'),
        telefoneWhatsapp: null,
        papel: Role.GERENTE,
      });

      const result = await useCase.loginVendedor({ storeId, userId: gerente.id, pin: '9876' });

      expect(result.isOk).toBe(true);
      expect(result.value.user.papel).toBe(Role.GERENTE);
    });
  });
});

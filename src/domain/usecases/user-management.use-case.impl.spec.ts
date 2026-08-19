import { UserManagementUseCaseImpl } from './user-management.use-case.impl';
import { FakePasswordHasher, FakeUserRepository } from './__fakes__';
import { ConflictFailure, ValidationFailure } from '../failures';
import { Role } from '../entities';

describe('UserManagementUseCaseImpl', () => {
  const storeId = 'store-1';
  let userRepository: FakeUserRepository;
  let useCase: UserManagementUseCaseImpl;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new UserManagementUseCaseImpl(userRepository, new FakePasswordHasher());
  });

  describe('ADMIN/COMPRADOR (email+senha)', () => {
    it('cria um usuario com sucesso', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Comprador A',
        email: 'comprador@loja.com',
        senha: 'senha12345',
        telefoneWhatsapp: '5511999990000',
        papel: Role.COMPRADOR,
      });

      expect(result.isOk).toBe(true);
      expect(result.value.email).toBe('comprador@loja.com');
      expect(result.value.senhaHash).not.toBe('senha12345');
      expect(result.value.usuario).toBeNull();
    });

    it('rejeita e-mail duplicado na mesma loja', async () => {
      await useCase.create({
        storeId,
        nome: 'Comprador A',
        email: 'comprador@loja.com',
        senha: 'senha12345',
        telefoneWhatsapp: null,
        papel: Role.COMPRADOR,
      });

      const result = await useCase.create({
        storeId,
        nome: 'Outro Comprador',
        email: 'comprador@loja.com',
        senha: 'outrasenha',
        telefoneWhatsapp: null,
        papel: Role.COMPRADOR,
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(ConflictFailure);
    });

    it('rejeita criacao sem e-mail', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Sem Email',
        senha: 'senha12345',
        telefoneWhatsapp: null,
        papel: Role.ADMIN,
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationFailure);
    });

    it('desativa um usuario existente', async () => {
      const criado = await useCase.create({
        storeId,
        nome: 'Comprador B',
        email: 'comprador2@loja.com',
        senha: 'senha12345',
        telefoneWhatsapp: null,
        papel: Role.COMPRADOR,
      });

      const result = await useCase.deactivate(criado.value.id);

      expect(result.isOk).toBe(true);
      expect(result.value.ativo).toBe(false);
    });
  });

  describe('VENDEDOR (usuario+PIN)', () => {
    it('cria um vendedor com sucesso', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Vendedor A',
        usuario: 'vendedor.a',
        pin: '1234',
        telefoneWhatsapp: '5511999990000',
        papel: Role.VENDEDOR,
      });

      expect(result.isOk).toBe(true);
      expect(result.value.usuario).toBe('vendedor.a');
      expect(result.value.pinHash).not.toBe('1234');
      expect(result.value.email).toBeNull();
    });

    it('normaliza o usuario para minusculas', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Vendedor A',
        usuario: 'Vendedor.A',
        pin: '1234',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      expect(result.isOk).toBe(true);
      expect(result.value.usuario).toBe('vendedor.a');
    });

    it('rejeita usuario duplicado na mesma loja', async () => {
      await useCase.create({
        storeId,
        nome: 'Vendedor A',
        usuario: 'vendedor.a',
        pin: '1234',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      const result = await useCase.create({
        storeId,
        nome: 'Outro Vendedor',
        usuario: 'vendedor.a',
        pin: '5678',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(ConflictFailure);
    });

    it('rejeita PIN fora do formato de 4-6 digitos', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Vendedor A',
        usuario: 'vendedor.a',
        pin: '12',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationFailure);
    });

    it('rejeita criacao sem usuario', async () => {
      const result = await useCase.create({
        storeId,
        nome: 'Vendedor A',
        pin: '1234',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      expect(result.isErr).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationFailure);
    });

    it('permite trocar o PIN de um vendedor existente', async () => {
      const criado = await useCase.create({
        storeId,
        nome: 'Vendedor A',
        usuario: 'vendedor.a',
        pin: '1234',
        telefoneWhatsapp: null,
        papel: Role.VENDEDOR,
      });

      const result = await useCase.update(criado.value.id, { pin: '9999' });

      expect(result.isOk).toBe(true);
      expect(result.value.pinHash).not.toBe(criado.value.pinHash);
    });
  });
});

import { UserManagementUseCaseImpl } from './user-management.use-case.impl';
import { FakePasswordHasher, FakeUserRepository } from './__fakes__';
import { ConflictFailure } from '../failures';
import { Role } from '../entities';

describe('UserManagementUseCaseImpl', () => {
  const storeId = 'store-1';
  let userRepository: FakeUserRepository;
  let useCase: UserManagementUseCaseImpl;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new UserManagementUseCaseImpl(userRepository, new FakePasswordHasher());
  });

  it('cria um usuario com sucesso', async () => {
    const result = await useCase.create({
      storeId,
      nome: 'Vendedor A',
      email: 'vendedor@loja.com',
      senha: 'senha12345',
      telefoneWhatsapp: '5511999990000',
      papel: Role.VENDEDOR,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.email).toBe('vendedor@loja.com');
    expect(result.value.senhaHash).not.toBe('senha12345');
  });

  it('rejeita e-mail duplicado na mesma loja', async () => {
    await useCase.create({
      storeId,
      nome: 'Vendedor A',
      email: 'vendedor@loja.com',
      senha: 'senha12345',
      telefoneWhatsapp: null,
      papel: Role.VENDEDOR,
    });

    const result = await useCase.create({
      storeId,
      nome: 'Outro Vendedor',
      email: 'vendedor@loja.com',
      senha: 'outrasenha',
      telefoneWhatsapp: null,
      papel: Role.VENDEDOR,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ConflictFailure);
  });

  it('desativa um usuario existente', async () => {
    const criado = await useCase.create({
      storeId,
      nome: 'Vendedor A',
      email: 'vendedor2@loja.com',
      senha: 'senha12345',
      telefoneWhatsapp: null,
      papel: Role.VENDEDOR,
    });

    const result = await useCase.deactivate(criado.value.id);

    expect(result.isOk).toBe(true);
    expect(result.value.ativo).toBe(false);
  });
});

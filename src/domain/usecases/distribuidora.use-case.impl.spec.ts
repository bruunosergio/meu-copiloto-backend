import { DistribuidoraUseCaseImpl } from './distribuidora.use-case.impl';
import { FakeDistribuidoraRepository } from './__fakes__';
import { ConflictFailure, NotFoundFailure, ValidationFailure } from '../failures';

describe('DistribuidoraUseCaseImpl', () => {
  const storeId = 'store-1';
  let distribuidoraRepository: FakeDistribuidoraRepository;
  let useCase: DistribuidoraUseCaseImpl;

  beforeEach(() => {
    distribuidoraRepository = new FakeDistribuidoraRepository();
    useCase = new DistribuidoraUseCaseImpl(distribuidoraRepository);
  });

  it('cadastra uma nova distribuidora', async () => {
    const result = await useCase.create({ storeId, nome: 'LIGPECAS' });

    expect(result.isOk).toBe(true);
    expect(result.value.nome).toBe('LIGPECAS');
    expect(result.value.ativa).toBe(true);
  });

  it('rejeita nome vazio', async () => {
    const result = await useCase.create({ storeId, nome: '   ' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('rejeita distribuidora duplicada na mesma loja', async () => {
    await useCase.create({ storeId, nome: 'DPK' });
    const result = await useCase.create({ storeId, nome: 'DPK' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ConflictFailure);
  });

  it('lista apenas as distribuidoras da loja informada', async () => {
    await useCase.create({ storeId, nome: 'LIGPECAS' });
    await useCase.create({ storeId: 'outra-loja', nome: 'Sama' });

    const result = await useCase.listByStore(storeId);

    expect(result.isOk).toBe(true);
    expect(result.value).toHaveLength(1);
    expect(result.value[0].nome).toBe('LIGPECAS');
  });

  it('permite desativar e reativar uma distribuidora', async () => {
    const criada = await useCase.create({ storeId, nome: 'Roles' });

    const desativada = await useCase.setAtiva(criada.value.id, false);
    expect(desativada.isOk).toBe(true);
    expect(desativada.value.ativa).toBe(false);

    const reativada = await useCase.setAtiva(criada.value.id, true);
    expect(reativada.isOk).toBe(true);
    expect(reativada.value.ativa).toBe(true);
  });

  it('retorna falha ao tentar (des)ativar distribuidora inexistente', async () => {
    const result = await useCase.setAtiva('nao-existe', false);

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundFailure);
  });
});

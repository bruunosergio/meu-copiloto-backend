import { EmprestimoUseCaseImpl } from './emprestimo.use-case.impl';
import { FakeEmprestimoRepository } from './__fakes__';
import { EmprestimoStatus } from '../entities';
import { NotFoundFailure, ValidationFailure } from '../failures';

describe('EmprestimoUseCaseImpl', () => {
  const storeId = 'store-1';
  let repository: FakeEmprestimoRepository;
  let useCase: EmprestimoUseCaseImpl;

  beforeEach(() => {
    repository = new FakeEmprestimoRepository();
    useCase = new EmprestimoUseCaseImpl(repository);
  });

  async function criarEmprestimo(shortageId: string, emprestadaDe: string | null = 'Loja X') {
    return repository.create({
      storeId,
      shortageId,
      emprestadaDe,
      registradoPorId: 'vendedor-1',
    });
  }

  it('lista emprestimos filtrando por status', async () => {
    const a = await criarEmprestimo('falta-1');
    await criarEmprestimo('falta-2');
    await useCase.devolver({
      ids: [a.id],
      storeId,
      executadoPorId: 'comprador-1',
      devolvidoPara: 'Loja X',
    });

    const pendentes = await useCase.list({ storeId, status: EmprestimoStatus.PENDENTE });
    const devolvidos = await useCase.list({ storeId, status: EmprestimoStatus.DEVOLVIDA });

    expect(pendentes.value).toHaveLength(1);
    expect(devolvidos.value).toHaveLength(1);
  });

  it('devolve em lote registrando quem marcou, a quem e quando', async () => {
    const a = await criarEmprestimo('falta-1');
    const b = await criarEmprestimo('falta-2');

    const result = await useCase.devolver({
      ids: [a.id, b.id],
      storeId,
      executadoPorId: 'comprador-1',
      devolvidoPara: '  Loja Parceira  ',
    });

    expect(result.isOk).toBe(true);
    expect(result.value).toHaveLength(2);
    for (const emprestimo of result.value) {
      expect(emprestimo.status).toBe(EmprestimoStatus.DEVOLVIDA);
      expect(emprestimo.devolvidoPorId).toBe('comprador-1');
      expect(emprestimo.devolvidoPara).toBe('Loja Parceira');
      expect(emprestimo.devolvidoEm).not.toBeNull();
    }
  });

  it('exige informar a quem foi devolvido', async () => {
    const a = await criarEmprestimo('falta-1');

    const result = await useCase.devolver({
      ids: [a.id],
      storeId,
      executadoPorId: 'comprador-1',
      devolvidoPara: '   ',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('rejeita devolucao de emprestimo ja devolvido (nada e alterado)', async () => {
    const a = await criarEmprestimo('falta-1');
    const b = await criarEmprestimo('falta-2');
    await useCase.devolver({
      ids: [a.id],
      storeId,
      executadoPorId: 'comprador-1',
      devolvidoPara: 'Loja X',
    });

    const result = await useCase.devolver({
      ids: [a.id, b.id],
      storeId,
      executadoPorId: 'comprador-1',
      devolvidoPara: 'Loja X',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
    const pendentes = await repository.listByStore(storeId, EmprestimoStatus.PENDENTE);
    expect(pendentes).toHaveLength(1);
  });

  it('rejeita emprestimo de outra loja', async () => {
    const a = await criarEmprestimo('falta-1');

    const result = await useCase.devolver({
      ids: [a.id],
      storeId: 'outra-loja',
      executadoPorId: 'comprador-1',
      devolvidoPara: 'Loja X',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundFailure);
  });
});

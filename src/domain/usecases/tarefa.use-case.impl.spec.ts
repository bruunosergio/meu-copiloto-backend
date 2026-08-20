import { TarefaUseCaseImpl } from './tarefa.use-case.impl';
import { FakeTarefaRepository } from './__fakes__';
import { TarefaStatus } from '../entities';

describe('TarefaUseCaseImpl', () => {
  const storeId = 'loja-piloto';
  let repository: FakeTarefaRepository;
  let useCase: TarefaUseCaseImpl;

  beforeEach(() => {
    repository = new FakeTarefaRepository();
    useCase = new TarefaUseCaseImpl(repository);
  });

  it('cria sprint e tarefa no backlog, depois move para a sprint', async () => {
    const sprint = await useCase.createSprint({
      storeId,
      nome: 'Semana 19/08',
      inicio: null,
      fim: null,
      criadoPorId: 'gerente-1',
    });
    expect(sprint.isOk).toBe(true);

    const tarefa = await useCase.createTarefa({
      storeId,
      sprintId: null,
      titulo: 'Organizar prateleira',
      descricao: null,
      prazo: null,
      criadoPorId: 'gerente-1',
    });
    expect(tarefa.isOk).toBe(true);
    expect(tarefa.value.sprintId).toBeNull();
    expect(tarefa.value.status).toBe(TarefaStatus.A_FAZER);

    const movida = await useCase.updateTarefa({
      tarefaId: tarefa.value.id,
      storeId,
      sprintId: sprint.value.id,
      status: TarefaStatus.EM_ANDAMENTO,
    });
    expect(movida.isOk).toBe(true);
    expect(movida.value.sprintId).toBe(sprint.value.id);
    expect(movida.value.status).toBe(TarefaStatus.EM_ANDAMENTO);
  });

  it('rejeita sprint sem nome', async () => {
    const result = await useCase.createSprint({
      storeId,
      nome: '   ',
      inicio: null,
      fim: null,
      criadoPorId: 'gerente-1',
    });
    expect(result.isErr).toBe(true);
  });

  it('marca concluidaEm ao concluir e limpa se voltar', async () => {
    const criada = await useCase.createTarefa({
      storeId,
      sprintId: null,
      titulo: 'Ligar no fornecedor',
      descricao: null,
      prazo: null,
      criadoPorId: 'gerente-1',
    });

    const concluida = await useCase.updateTarefa({
      tarefaId: criada.value.id,
      storeId,
      status: TarefaStatus.CONCLUIDA,
    });
    expect(concluida.isOk).toBe(true);
    expect(concluida.value.toPublic().concluidaEm).not.toBeNull();

    const reaberta = await useCase.updateTarefa({
      tarefaId: criada.value.id,
      storeId,
      status: TarefaStatus.A_FAZER,
    });
    expect(reaberta.value.toPublic().concluidaEm).toBeNull();
  });
});

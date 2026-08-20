import { Sprint as PrismaSprint, Tarefa as PrismaTarefa } from '@prisma/client';
import { Sprint, Tarefa, TarefaStatus } from '../../domain/entities';

export class SprintMapper {
  static toDomain(raw: PrismaSprint): Sprint {
    return new Sprint({
      id: raw.id,
      storeId: raw.storeId,
      nome: raw.nome,
      inicio: raw.inicio,
      fim: raw.fim,
      encerrada: raw.encerrada,
      criadoPorId: raw.criadoPorId,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }
}

export class TarefaMapper {
  static toDomain(raw: PrismaTarefa): Tarefa {
    return new Tarefa({
      id: raw.id,
      storeId: raw.storeId,
      sprintId: raw.sprintId,
      titulo: raw.titulo,
      descricao: raw.descricao,
      status: raw.status as TarefaStatus,
      prazo: raw.prazo,
      criadoPorId: raw.criadoPorId,
      concluidaEm: raw.concluidaEm,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }
}

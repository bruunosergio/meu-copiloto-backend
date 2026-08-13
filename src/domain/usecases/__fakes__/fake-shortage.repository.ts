import {
  CreateShortageData,
  ShortageFilters,
  ShortageRepository,
} from '../../ports/output';
import { Shortage, ShortageStatus, StatusTransition } from '../../entities';

export class FakeShortageRepository implements ShortageRepository {
  private shortages: Shortage[] = [];
  private transitions: StatusTransition[] = [];
  private nextShortageId = 1;
  private nextTransitionId = 1;

  async findById(id: string): Promise<Shortage | null> {
    return this.shortages.find((s) => s.id === id) ?? null;
  }

  async list(filters: ShortageFilters): Promise<Shortage[]> {
    return this.shortages.filter(
      (s) =>
        s.storeId === filters.storeId &&
        (!filters.status || filters.status.includes(s.status)) &&
        (!filters.registradoPorId || s.registradoPorId === filters.registradoPorId),
    );
  }

  async create(data: CreateShortageData): Promise<Shortage> {
    const shortage = new Shortage({
      id: `shortage-${this.nextShortageId++}`,
      storeId: data.storeId,
      codigoPeca: data.codigoPeca,
      nomePeca: data.nomePeca,
      qtdRestante: data.qtdRestante,
      observacao: data.observacao,
      registradoPorId: data.registradoPorId,
      distribuidoraId: null,
      origem: data.origem,
      status: ShortageStatus.REGISTRADA,
      criadaEm: new Date(),
      atualizadaEm: new Date(),
    });
    this.shortages.push(shortage);
    return shortage;
  }

  async updateStatus(
    id: string,
    status: ShortageStatus,
    distribuidoraId?: string | null,
  ): Promise<Shortage> {
    const index = this.shortages.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Falta nao encontrada no fake repository.');
    const atual = this.shortages[index].toSnapshot();
    const atualizada = new Shortage({
      ...atual,
      status,
      ...(distribuidoraId !== undefined && { distribuidoraId }),
      atualizadaEm: new Date(),
    });
    this.shortages[index] = atualizada;
    return atualizada;
  }

  async setDistribuidora(id: string, distribuidoraId: string | null): Promise<Shortage> {
    const index = this.shortages.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Falta nao encontrada no fake repository.');
    const atual = this.shortages[index].toSnapshot();
    const atualizada = new Shortage({ ...atual, distribuidoraId, atualizadaEm: new Date() });
    this.shortages[index] = atualizada;
    return atualizada;
  }

  async recordTransition(data: {
    shortageId: string;
    de: ShortageStatus | null;
    para: ShortageStatus;
    executadaPorId: string;
    motivo: string | null;
  }): Promise<StatusTransition> {
    const transition = new StatusTransition({
      id: `transition-${this.nextTransitionId++}`,
      shortageId: data.shortageId,
      de: data.de,
      para: data.para,
      executadaPorId: data.executadaPorId,
      motivo: data.motivo,
      ocorridaEm: new Date(),
    });
    this.transitions.push(transition);
    return transition;
  }

  async listTransitions(shortageId: string): Promise<StatusTransition[]> {
    return this.transitions.filter((t) => t.shortageId === shortageId);
  }
}

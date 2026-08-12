import { Shortage, ShortageOrigin, ShortageStatus, StatusTransition } from '../../entities';

export interface CreateShortageData {
  storeId: string;
  codigoPeca: string | null;
  nomePeca: string;
  qtdRestante: number;
  observacao: string | null;
  registradoPorId: string;
  origem: ShortageOrigin;
}

export interface ShortageFilters {
  storeId: string;
  status?: ShortageStatus[];
  registradoPorId?: string;
}

export interface ShortageRepository {
  findById(id: string): Promise<Shortage | null>;
  list(filters: ShortageFilters): Promise<Shortage[]>;
  create(data: CreateShortageData): Promise<Shortage>;
  updateStatus(id: string, status: ShortageStatus): Promise<Shortage>;
  recordTransition(data: {
    shortageId: string;
    de: ShortageStatus | null;
    para: ShortageStatus;
    executadaPorId: string;
    motivo: string | null;
  }): Promise<StatusTransition>;
  listTransitions(shortageId: string): Promise<StatusTransition[]>;
}

export const SHORTAGE_REPOSITORY = 'SHORTAGE_REPOSITORY';

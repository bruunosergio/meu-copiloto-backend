import {
  Shortage as PrismaShortage,
  StatusTransition as PrismaStatusTransition,
} from '@prisma/client';
import { Shortage, ShortageOrigin, ShortageStatus, StatusTransition } from '../../domain/entities';

export class ShortageMapper {
  static toDomain(raw: PrismaShortage): Shortage {
    return new Shortage({
      id: raw.id,
      storeId: raw.storeId,
      codigoPeca: raw.codigoPeca,
      nomePeca: raw.nomePeca,
      qtdRestante: raw.qtdRestante,
      observacao: raw.observacao,
      registradoPorId: raw.registradoPorId,
      distribuidoraId: raw.distribuidoraId,
      origem: raw.origem as ShortageOrigin,
      status: raw.status as ShortageStatus,
      criadaEm: raw.criadaEm,
      atualizadaEm: raw.atualizadaEm,
    });
  }
}

export class StatusTransitionMapper {
  static toDomain(raw: PrismaStatusTransition): StatusTransition {
    return new StatusTransition({
      id: raw.id,
      shortageId: raw.shortageId,
      de: raw.de as ShortageStatus | null,
      para: raw.para as ShortageStatus,
      executadaPorId: raw.executadaPorId,
      motivo: raw.motivo,
      ocorridaEm: raw.ocorridaEm,
    });
  }
}

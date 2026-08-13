import { Distribuidora as PrismaDistribuidora } from '@prisma/client';
import { Distribuidora } from '../../domain/entities';

export class DistribuidoraMapper {
  static toDomain(raw: PrismaDistribuidora): Distribuidora {
    return new Distribuidora({
      id: raw.id,
      storeId: raw.storeId,
      nome: raw.nome,
      ativa: raw.ativa,
      criadaEm: raw.criadaEm,
      atualizadaEm: raw.atualizadaEm,
    });
  }
}

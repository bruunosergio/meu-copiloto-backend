import { Store as PrismaStore } from '@prisma/client';
import { Store } from '../../domain/entities';

export class StoreMapper {
  static toDomain(raw: PrismaStore): Store {
    return new Store({
      id: raw.id,
      codigo: raw.codigo,
      senhaHash: raw.senhaHash,
      nome: raw.nome,
      segmento: raw.segmento,
      whatsappNumero: raw.whatsappNumero,
      ativa: raw.ativa,
      criadaEm: raw.criadaEm,
      atualizadaEm: raw.atualizadaEm,
    });
  }
}

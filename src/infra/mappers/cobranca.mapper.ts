import {
  CobrancaAcompanhamento as PrismaAcompanhamento,
  CobrancaConfig as PrismaConfig,
  CobrancaRegra as PrismaRegra,
  CobrancaRelatorio as PrismaRelatorio,
} from '@prisma/client';
import { parseRawClients } from '../../domain/cobranca/raw-client';
import {
  CobrancaAcompanhamento,
  CobrancaAtencao,
  CobrancaConfig,
  CobrancaRegra,
  CobrancaRelatorio,
  CobrancaStatus,
} from '../../domain/entities';

export class CobrancaMapper {
  static relatorioToDomain(raw: PrismaRelatorio): CobrancaRelatorio {
    const clientes = parseRawClients(raw.clientes) ?? [];
    return {
      id: raw.id,
      storeId: raw.storeId,
      referencia: raw.referencia,
      fonte: raw.fonte,
      clientes,
      importadoEm: raw.importadoEm,
      importadoPorId: raw.importadoPorId,
    };
  }

  static configToDomain(raw: PrismaConfig): CobrancaConfig {
    return {
      id: raw.id,
      storeId: raw.storeId,
      dddPadrao: raw.dddPadrao,
    };
  }

  static acompanhamentoToDomain(raw: PrismaAcompanhamento): CobrancaAcompanhamento {
    return {
      id: raw.id,
      storeId: raw.storeId,
      codigo: raw.codigo,
      telefoneOverride: raw.telefoneOverride,
      status: raw.status as CobrancaStatus,
      promessa: raw.promessa,
      anotacao: raw.anotacao,
      atualizadoEm: raw.atualizadoEm,
    };
  }

  static regraToDomain(raw: PrismaRegra): CobrancaRegra {
    return {
      id: raw.id,
      storeId: raw.storeId,
      tipo: raw.tipo as CobrancaAtencao,
      codigoCliente: raw.codigoCliente,
      nomeContem: raw.nomeContem,
      criadoEm: raw.criadoEm,
    };
  }
}

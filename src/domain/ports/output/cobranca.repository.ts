import {
  CobrancaAcompanhamento,
  CobrancaAtencao,
  CobrancaConfig,
  CobrancaRawClient,
  CobrancaRegra,
  CobrancaRelatorio,
  CobrancaStatus,
} from '../../entities';

export interface SaveCobrancaRelatorioData {
  storeId: string;
  referencia: string;
  fonte: string;
  clientes: CobrancaRawClient[];
  importadoPorId: string;
}

export interface UpsertCobrancaAcompanhamentoData {
  storeId: string;
  codigo: string;
  telefoneOverride?: string | null;
  status?: CobrancaStatus;
  promessa?: string | null;
  anotacao?: string | null;
}

export interface CreateCobrancaRegraData {
  storeId: string;
  tipo: CobrancaAtencao;
  codigoCliente: string | null;
  nomeContem: string | null;
}

export interface CobrancaRepository {
  findRelatorio(storeId: string): Promise<CobrancaRelatorio | null>;
  saveRelatorio(data: SaveCobrancaRelatorioData): Promise<CobrancaRelatorio>;
  listAcompanhamentos(storeId: string): Promise<CobrancaAcompanhamento[]>;
  upsertAcompanhamento(data: UpsertCobrancaAcompanhamentoData): Promise<CobrancaAcompanhamento>;
  resetPaidToCharge(storeId: string, codigos: string[]): Promise<void>;
  findConfig(storeId: string): Promise<CobrancaConfig | null>;
  upsertConfig(storeId: string, dddPadrao: string): Promise<CobrancaConfig>;
  listRegras(storeId: string): Promise<CobrancaRegra[]>;
  createRegras(data: CreateCobrancaRegraData[]): Promise<CobrancaRegra[]>;
  createRegra(data: CreateCobrancaRegraData): Promise<CobrancaRegra>;
  deleteRegra(id: string, storeId: string): Promise<boolean>;
}

export const COBRANCA_REPOSITORY = 'COBRANCA_REPOSITORY';

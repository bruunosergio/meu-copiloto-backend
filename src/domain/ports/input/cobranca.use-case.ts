import { Result } from '../../core/result';
import { Failure } from '../../failures';
import {
  CobrancaAtencao,
  CobrancaPainel,
  CobrancaRawClient,
  CobrancaRegra,
  CobrancaStatus,
} from '../../entities';

export interface ImportCobrancaInput {
  storeId: string;
  importadoPorId: string;
  referencia: string;
  fonte?: string;
  clientes: unknown;
}

export interface UpdateCobrancaClienteInput {
  storeId: string;
  codigo: string;
  telefone?: string | null;
  status?: CobrancaStatus;
  promessa?: string | null;
  anotacao?: string | null;
}

export interface UpdateCobrancaConfigInput {
  storeId: string;
  dddPadrao: string;
}

export interface CreateCobrancaRegraInput {
  storeId: string;
  tipo: CobrancaAtencao;
  codigoCliente?: string | null;
  nomeContem?: string | null;
}

export interface CobrancaUseCase {
  getPainel(storeId: string): Promise<Result<CobrancaPainel, Failure>>;
  importar(input: ImportCobrancaInput): Promise<Result<CobrancaPainel, Failure>>;
  atualizarCliente(input: UpdateCobrancaClienteInput): Promise<Result<CobrancaPainel, Failure>>;
  atualizarConfig(input: UpdateCobrancaConfigInput): Promise<Result<CobrancaPainel, Failure>>;
  criarRegra(input: CreateCobrancaRegraInput): Promise<Result<CobrancaRegra, Failure>>;
  excluirRegra(regraId: string, storeId: string): Promise<Result<void, Failure>>;
}

export const COBRANCA_USE_CASE = 'COBRANCA_USE_CASE';

export type { CobrancaRawClient };

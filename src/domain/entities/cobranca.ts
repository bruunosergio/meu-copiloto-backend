export enum CobrancaStatus {
  A_COBRAR = 'A_COBRAR',
  MENSAGEM = 'MENSAGEM',
  PROMETEU = 'PROMETEU',
  SEM_RESPOSTA = 'SEM_RESPOSTA',
  PAGO_PIX = 'PAGO_PIX',
  PAGO_CARTAO = 'PAGO_CARTAO',
  PAGO_DINHEIRO = 'PAGO_DINHEIRO',
  PAGO = 'PAGO',
  NAO_COBRAR = 'NAO_COBRAR',
}

export enum CobrancaAtencao {
  INTERNO = 'INTERNO',
  PREFEITURA = 'PREFEITURA',
  BALCAO = 'BALCAO',
}

export const COBRANCA_STATUS_LABEL: Record<CobrancaStatus, string> = {
  [CobrancaStatus.A_COBRAR]: 'A cobrar',
  [CobrancaStatus.MENSAGEM]: 'Mensagem enviada',
  [CobrancaStatus.PROMETEU]: 'Prometeu pagar',
  [CobrancaStatus.SEM_RESPOSTA]: 'Sem resposta',
  [CobrancaStatus.PAGO_PIX]: 'Pago no Pix',
  [CobrancaStatus.PAGO_CARTAO]: 'Pago no cartão',
  [CobrancaStatus.PAGO_DINHEIRO]: 'Pago em dinheiro',
  [CobrancaStatus.PAGO]: 'Pago na loja',
  [CobrancaStatus.NAO_COBRAR]: 'Não cobrar',
};

export const COBRANCA_ATENCAO_LABEL: Record<CobrancaAtencao, string> = {
  [CobrancaAtencao.INTERNO]: 'Conta interna',
  [CobrancaAtencao.PREFEITURA]: 'Prefeitura',
  [CobrancaAtencao.BALCAO]: 'Balcão',
};

export function isPaidCobrancaStatus(status: CobrancaStatus): boolean {
  return (
    status === CobrancaStatus.PAGO ||
    status === CobrancaStatus.PAGO_PIX ||
    status === CobrancaStatus.PAGO_CARTAO ||
    status === CobrancaStatus.PAGO_DINHEIRO
  );
}

export interface CobrancaRawDoc {
  desc: string;
  seller: string;
  tipo: string;
  emissao: string;
  venc: string;
  valor: number;
  saida: string;
  parcela: string;
}

export interface CobrancaRawClient {
  code: string;
  name: string;
  phones: string[];
  address: string[];
  bairro: string;
  city: string;
  uf: string;
  cep: string;
  numero: string;
  docs: CobrancaRawDoc[];
  total: number;
}

export interface CobrancaRegra {
  id: string;
  storeId: string;
  tipo: CobrancaAtencao;
  codigoCliente: string | null;
  nomeContem: string | null;
  criadoEm: Date;
}

export interface CobrancaAcompanhamento {
  id: string;
  storeId: string;
  codigo: string;
  telefoneOverride: string | null;
  status: CobrancaStatus;
  promessa: string | null;
  anotacao: string | null;
  atualizadoEm: Date;
}

export interface CobrancaConfig {
  id: string;
  storeId: string;
  dddPadrao: string;
}

export interface CobrancaRelatorio {
  id: string;
  storeId: string;
  referencia: string;
  fonte: string;
  clientes: CobrancaRawClient[];
  importadoEm: Date;
  importadoPorId: string;
}

export interface CobrancaDocView {
  desc: string;
  seller: string;
  sellerId: string;
  sellerName: string;
  tipo: string;
  tipoLabel: string;
  emissao: string;
  venc: string;
  valor: number;
  saida: string;
  parcela: string;
  days: number;
}

export interface CobrancaSellerSlice {
  id: string;
  name: string;
  vencido: number;
  total: number;
}

export interface CobrancaClientView {
  code: string;
  name: string;
  phones: string[];
  telefone: string;
  telefoneOverride: string | null;
  addressLine: string;
  city: string;
  docs: CobrancaDocView[];
  total: number;
  carteiraVencida: number;
  carteiraHoje: number;
  carteiraFutura: number;
  cartao: number;
  notasVencidas: number;
  oldestVenc: string | null;
  oldestDays: number | null;
  sellers: CobrancaSellerSlice[];
  primarySellerId: string;
  primarySellerName: string;
  attention: CobrancaAtencao | null;
  status: CobrancaStatus;
  promessa: string | null;
  anotacao: string | null;
}

export interface CobrancaAgingSlice {
  label: string;
  valor: number;
  notas: number;
}

export interface CobrancaStats {
  clientes: number;
  notas: number;
  total: number;
  carteiraVencida: number;
  carteiraHoje: number;
  carteiraFutura: number;
  cartao: number;
  semTelefone: number;
  aging: CobrancaAgingSlice[];
  sellers: { id: string; name: string; vencido: number }[];
}

export interface CobrancaPainel {
  lojaNome: string;
  dddPadrao: string;
  relatorio: {
    referencia: string;
    referenciaLabel: string;
    fonte: string;
    importadoEm: Date;
  } | null;
  reabertos: string[];
  clientes: CobrancaClientView[];
  stats: CobrancaStats;
  regras: CobrancaRegra[];
}

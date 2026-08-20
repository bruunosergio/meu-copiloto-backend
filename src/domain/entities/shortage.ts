/**
 * Ciclo simplificado (ADR-0008): a etapa de cotacao foi eliminada porque na
 * pratica dura minutos. CONCLUIDA = pedido feito na distribuidora vencedora;
 * RECEBIDA = a peca chegou na loja.
 */
export enum ShortageStatus {
  REGISTRADA = 'REGISTRADA',
  CONCLUIDA = 'CONCLUIDA',
  RECEBIDA = 'RECEBIDA',
  CANCELADA = 'CANCELADA',
}

export enum ShortageOrigin {
  WEB = 'WEB',
  WHATSAPP_AUDIO = 'WHATSAPP_AUDIO',
  WHATSAPP_TEXTO = 'WHATSAPP_TEXTO',
}

/**
 * Transicoes permitidas do ciclo de vida da falta.
 * Ver docs/02-modelo-dominio.md - secao 3.
 */
export const TRANSICOES_PERMITIDAS: Record<ShortageStatus, ShortageStatus[]> = {
  [ShortageStatus.REGISTRADA]: [ShortageStatus.CONCLUIDA, ShortageStatus.CANCELADA],
  [ShortageStatus.CONCLUIDA]: [ShortageStatus.RECEBIDA],
  [ShortageStatus.RECEBIDA]: [],
  [ShortageStatus.CANCELADA]: [],
};

export interface ShortageProps {
  id: string;
  storeId: string;
  codigoPeca: string | null;
  nomePeca: string;
  qtdRestante: number;
  observacao: string | null;
  registradoPorId: string;
  /**
   * Nome de quem registrou, carregado junto na leitura (read model) para a
   * fila do comprador nao precisar de uma segunda chamada. Null quando a
   * relacao nao foi carregada.
   */
  registradoPorNome?: string | null;
  distribuidoraId: string | null;
  origem: ShortageOrigin;
  status: ShortageStatus;
  criadaEm: Date;
  atualizadaEm: Date;
}

export class Shortage {
  constructor(private props: ShortageProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get codigoPeca(): string | null {
    return this.props.codigoPeca;
  }

  get nomePeca(): string {
    return this.props.nomePeca;
  }

  get qtdRestante(): number {
    return this.props.qtdRestante;
  }

  get observacao(): string | null {
    return this.props.observacao;
  }

  get registradoPorId(): string {
    return this.props.registradoPorId;
  }

  get registradoPorNome(): string | null {
    return this.props.registradoPorNome ?? null;
  }

  get distribuidoraId(): string | null {
    return this.props.distribuidoraId;
  }

  get origem(): ShortageOrigin {
    return this.props.origem;
  }

  get status(): ShortageStatus {
    return this.props.status;
  }

  get criadaEm(): Date {
    return this.props.criadaEm;
  }

  get atualizadaEm(): Date {
    return this.props.atualizadaEm;
  }

  podeTransicionarPara(novoStatus: ShortageStatus): boolean {
    return TRANSICOES_PERMITIDAS[this.status].includes(novoStatus);
  }

  toSnapshot(): ShortageProps {
    return { ...this.props };
  }

  toPublic() {
    return { ...this.props, registradoPorNome: this.registradoPorNome };
  }
}

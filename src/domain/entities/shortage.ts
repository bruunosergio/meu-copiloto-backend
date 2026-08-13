export enum ShortageStatus {
  REGISTRADA = 'REGISTRADA',
  EM_COTACAO = 'EM_COTACAO',
  COMPRADA = 'COMPRADA',
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
  [ShortageStatus.REGISTRADA]: [ShortageStatus.EM_COTACAO, ShortageStatus.CANCELADA],
  [ShortageStatus.EM_COTACAO]: [ShortageStatus.COMPRADA, ShortageStatus.CANCELADA],
  [ShortageStatus.COMPRADA]: [ShortageStatus.RECEBIDA],
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
    return { ...this.props };
  }
}

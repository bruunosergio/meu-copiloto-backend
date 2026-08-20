export enum EmprestimoStatus {
  PENDENTE = 'PENDENTE',
  DEVOLVIDA = 'DEVOLVIDA',
}

export interface EmprestimoProps {
  id: string;
  storeId: string;
  shortageId: string;
  /** De quem a peca foi emprestada (texto livre - loja/pessoa parceira). */
  emprestadaDe: string | null;
  status: EmprestimoStatus;
  registradoPorId: string;
  devolvidoPorId: string | null;
  /** A quem a peca foi devolvida (texto livre, preenchido ao marcar devolucao). */
  devolvidoPara: string | null;
  devolvidoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  // Campos de leitura carregados junto (read model) para a tela de emprestimos.
  pecaNome?: string | null;
  pecaCodigo?: string | null;
  faltaStatus?: string | null;
  registradoPorNome?: string | null;
  devolvidoPorNome?: string | null;
}

export class Emprestimo {
  constructor(private readonly props: EmprestimoProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get shortageId(): string {
    return this.props.shortageId;
  }

  get emprestadaDe(): string | null {
    return this.props.emprestadaDe;
  }

  get status(): EmprestimoStatus {
    return this.props.status;
  }

  get registradoPorId(): string {
    return this.props.registradoPorId;
  }

  get devolvidoPorId(): string | null {
    return this.props.devolvidoPorId;
  }

  get devolvidoPara(): string | null {
    return this.props.devolvidoPara;
  }

  get devolvidoEm(): Date | null {
    return this.props.devolvidoEm;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  isPendente(): boolean {
    return this.props.status === EmprestimoStatus.PENDENTE;
  }

  toPublic() {
    return {
      id: this.props.id,
      storeId: this.props.storeId,
      shortageId: this.props.shortageId,
      emprestadaDe: this.props.emprestadaDe,
      status: this.props.status,
      registradoPorId: this.props.registradoPorId,
      registradoPorNome: this.props.registradoPorNome ?? null,
      devolvidoPorId: this.props.devolvidoPorId,
      devolvidoPorNome: this.props.devolvidoPorNome ?? null,
      devolvidoPara: this.props.devolvidoPara,
      devolvidoEm: this.props.devolvidoEm,
      criadoEm: this.props.criadoEm,
      atualizadoEm: this.props.atualizadoEm,
      pecaNome: this.props.pecaNome ?? null,
      pecaCodigo: this.props.pecaCodigo ?? null,
      faltaStatus: this.props.faltaStatus ?? null,
    };
  }
}

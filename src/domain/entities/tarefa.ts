export enum TarefaStatus {
  A_FAZER = 'A_FAZER',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
}

export interface TarefaProps {
  id: string;
  storeId: string;
  /** Null = backlog (fora de qualquer sprint). */
  sprintId: string | null;
  titulo: string;
  descricao: string | null;
  status: TarefaStatus;
  prazo: Date | null;
  criadoPorId: string;
  concluidaEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Tarefa {
  constructor(private readonly props: TarefaProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get sprintId(): string | null {
    return this.props.sprintId;
  }

  get status(): TarefaStatus {
    return this.props.status;
  }

  toPublic() {
    return { ...this.props };
  }
}

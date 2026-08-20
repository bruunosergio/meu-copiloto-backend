export interface SprintProps {
  id: string;
  storeId: string;
  nome: string;
  inicio: Date | null;
  fim: Date | null;
  encerrada: boolean;
  criadoPorId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Sprint {
  constructor(private readonly props: SprintProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get encerrada(): boolean {
    return this.props.encerrada;
  }

  toPublic() {
    return { ...this.props };
  }
}

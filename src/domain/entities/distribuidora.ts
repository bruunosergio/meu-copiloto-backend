export interface DistribuidoraProps {
  id: string;
  storeId: string;
  nome: string;
  ativa: boolean;
  criadaEm: Date;
  atualizadaEm: Date;
}

export class Distribuidora {
  constructor(private readonly props: DistribuidoraProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get ativa(): boolean {
    return this.props.ativa;
  }

  get criadaEm(): Date {
    return this.props.criadaEm;
  }

  get atualizadaEm(): Date {
    return this.props.atualizadaEm;
  }

  toPublic() {
    return { ...this.props };
  }
}

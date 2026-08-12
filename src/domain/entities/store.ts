export interface StoreProps {
  id: string;
  nome: string;
  segmento: string;
  whatsappNumero: string | null;
  ativa: boolean;
  criadaEm: Date;
  atualizadaEm: Date;
}

export class Store {
  constructor(private readonly props: StoreProps) {}

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get segmento(): string {
    return this.props.segmento;
  }

  get whatsappNumero(): string | null {
    return this.props.whatsappNumero;
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
}

import { ShortageStatus } from './shortage';

export interface StatusTransitionProps {
  id: string;
  shortageId: string;
  de: ShortageStatus | null;
  para: ShortageStatus;
  executadaPorId: string;
  motivo: string | null;
  ocorridaEm: Date;
}

export class StatusTransition {
  constructor(private readonly props: StatusTransitionProps) {}

  get id(): string {
    return this.props.id;
  }

  get shortageId(): string {
    return this.props.shortageId;
  }

  get de(): ShortageStatus | null {
    return this.props.de;
  }

  get para(): ShortageStatus {
    return this.props.para;
  }

  get executadaPorId(): string {
    return this.props.executadaPorId;
  }

  get motivo(): string | null {
    return this.props.motivo;
  }

  get ocorridaEm(): Date {
    return this.props.ocorridaEm;
  }
}

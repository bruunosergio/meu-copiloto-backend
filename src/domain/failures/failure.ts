export abstract class Failure {
  protected constructor(public readonly message: string) {}
}

export class NotFoundFailure extends Failure {
  constructor(entity: string, id: string) {
    super(`${entity} nao encontrado(a): ${id}`);
  }
}

export class InvalidCredentialsFailure extends Failure {
  constructor(message = 'E-mail ou senha invalidos.') {
    super(message);
  }
}

export class UnauthorizedFailure extends Failure {
  constructor(message = 'Voce nao tem permissao para executar esta acao.') {
    super(message);
  }
}

export class ConflictFailure extends Failure {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationFailure extends Failure {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidTransitionFailure extends Failure {
  constructor(de: string, para: string) {
    super(`Transicao invalida: nao e possivel ir de "${de}" para "${para}".`);
  }
}

export class UnexpectedFailure extends Failure {
  constructor(originalError?: unknown) {
    super('Ocorreu um erro inesperado.');
    this.originalError = originalError;
  }
  readonly originalError?: unknown;
}

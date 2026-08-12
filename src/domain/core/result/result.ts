export class Unit {
  private static readonly instance = new Unit();
  private constructor() {}
  static get value(): Unit {
    return Unit.instance;
  }
}

export const unit = Unit.value;

export class Result<T, E = Error> {
  private constructor(
    private readonly _isOk: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static error<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  get isOk(): boolean {
    return this._isOk;
  }

  get isErr(): boolean {
    return !this._isOk;
  }

  get value(): T {
    if (!this._isOk) {
      throw new Error('Tentativa de acessar o valor de um Result de erro.');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isOk) {
      throw new Error('Tentativa de acessar o erro de um Result de sucesso.');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok(fn(this._value as T));
    }
    return Result.error(this._error as E);
  }

  fold<U>(onOk: (value: T) => U, onError: (error: E) => U): U {
    return this._isOk ? onOk(this._value as T) : onError(this._error as E);
  }
}

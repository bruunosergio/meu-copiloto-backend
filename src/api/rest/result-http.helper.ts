import { HttpException } from '@nestjs/common';
import { Result } from '../../domain/core/result';
import { Failure } from '../../domain/failures';
import { httpStatusFor } from './failure-http.mapper';

/**
 * Desembrulha um Result vindo de um use case: devolve o valor de sucesso
 * ou lanca a HttpException correspondente ao Failure.
 */
export function unwrapOrThrow<T>(result: Result<T, Failure>): T {
  if (result.isOk) {
    return result.value;
  }
  const failure = result.error;
  throw new HttpException({ message: failure.message }, httpStatusFor(failure));
}

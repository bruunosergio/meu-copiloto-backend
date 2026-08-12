import { HttpStatus } from '@nestjs/common';
import {
  ConflictFailure,
  Failure,
  InvalidCredentialsFailure,
  InvalidTransitionFailure,
  NotFoundFailure,
  UnauthorizedFailure,
  ValidationFailure,
} from '../../domain/failures';

/**
 * Unico ponto da API que conhece a traducao de Failure (domain) -> status HTTP.
 * Controllers chamam isto ao receber Result.error(...) de um use case.
 */
export function httpStatusFor(failure: Failure): number {
  if (failure instanceof NotFoundFailure) return HttpStatus.NOT_FOUND;
  if (failure instanceof InvalidCredentialsFailure) return HttpStatus.UNAUTHORIZED;
  if (failure instanceof UnauthorizedFailure) return HttpStatus.FORBIDDEN;
  if (failure instanceof ConflictFailure) return HttpStatus.CONFLICT;
  if (failure instanceof ValidationFailure) return HttpStatus.BAD_REQUEST;
  if (failure instanceof InvalidTransitionFailure) return HttpStatus.BAD_REQUEST;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

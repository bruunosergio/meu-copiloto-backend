import { Module } from '@nestjs/common';
import { InfraModule } from './infra.module';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
  SHORTAGE_REPOSITORY,
  ShortageRepository,
  TOKEN_PROVIDER,
  TokenPort,
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/output';
import { AUTH_USE_CASE, SHORTAGE_USE_CASE, USER_MANAGEMENT_USE_CASE } from '../../domain/ports/input';
import {
  AuthUseCaseImpl,
  ShortageUseCaseImpl,
  UserManagementUseCaseImpl,
} from '../../domain/usecases';

/**
 * Composition root do dominio: os *UseCaseImpl nao tem nenhum decorator do NestJS
 * (ver docs/03-arquitetura.md). Aqui, e so aqui, o container do Nest instancia
 * essas classes manualmente via useFactory, injetando as portas de saida.
 */
@Module({
  imports: [InfraModule],
  providers: [
    {
      provide: AUTH_USE_CASE,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasherPort,
        tokenProvider: TokenPort,
      ) => new AuthUseCaseImpl(userRepository, passwordHasher, tokenProvider),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_PROVIDER],
    },
    {
      provide: USER_MANAGEMENT_USE_CASE,
      useFactory: (userRepository: UserRepository, passwordHasher: PasswordHasherPort) =>
        new UserManagementUseCaseImpl(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: SHORTAGE_USE_CASE,
      useFactory: (shortageRepository: ShortageRepository, userRepository: UserRepository) =>
        new ShortageUseCaseImpl(shortageRepository, userRepository),
      inject: [SHORTAGE_REPOSITORY, USER_REPOSITORY],
    },
  ],
  exports: [AUTH_USE_CASE, USER_MANAGEMENT_USE_CASE, SHORTAGE_USE_CASE],
})
export class DomainModule {}

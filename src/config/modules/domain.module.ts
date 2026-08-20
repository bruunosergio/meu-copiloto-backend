import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InfraModule } from './infra.module';
import {
  DISTRIBUIDORA_REPOSITORY,
  DistribuidoraRepository,
  EMPRESTIMO_REPOSITORY,
  EmprestimoRepository,
  PASSWORD_HASHER,
  PasswordHasherPort,
  SHORTAGE_REPOSITORY,
  ShortageRepository,
  STORE_REPOSITORY,
  StoreRepository,
  TAREFA_REPOSITORY,
  TarefaRepository,
  TOKEN_PROVIDER,
  TokenPort,
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/output';
import {
  AUTH_USE_CASE,
  DISTRIBUIDORA_USE_CASE,
  EMPRESTIMO_USE_CASE,
  SHORTAGE_USE_CASE,
  TAREFA_USE_CASE,
  USER_MANAGEMENT_USE_CASE,
} from '../../domain/ports/input';
import {
  AuthUseCaseImpl,
  DistribuidoraUseCaseImpl,
  EmprestimoUseCaseImpl,
  ShortageUseCaseImpl,
  TarefaUseCaseImpl,
  UserManagementUseCaseImpl,
} from '../../domain/usecases';

/**
 * Composition root do dominio: os *UseCaseImpl nao tem nenhum decorator do NestJS
 * (ver docs/03-arquitetura.md). Aqui, e so aqui, o container do Nest instancia
 * essas classes manualmente via useFactory, injetando as portas de saida.
 */
@Module({
  imports: [InfraModule, ConfigModule],
  providers: [
    {
      provide: AUTH_USE_CASE,
      useFactory: (
        userRepository: UserRepository,
        storeRepository: StoreRepository,
        passwordHasher: PasswordHasherPort,
        tokenProvider: TokenPort,
        config: ConfigService,
      ) =>
        new AuthUseCaseImpl(userRepository, storeRepository, passwordHasher, tokenProvider, {
          storeTokenExpiresIn: config.get<string>('JWT_EXPIRES_IN_LOJA', '12h'),
          vendedorTokenExpiresIn: config.get<string>('JWT_EXPIRES_IN_VENDEDOR', '20m'),
        }),
      inject: [USER_REPOSITORY, STORE_REPOSITORY, PASSWORD_HASHER, TOKEN_PROVIDER, ConfigService],
    },
    {
      provide: USER_MANAGEMENT_USE_CASE,
      useFactory: (userRepository: UserRepository, passwordHasher: PasswordHasherPort) =>
        new UserManagementUseCaseImpl(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: SHORTAGE_USE_CASE,
      useFactory: (
        shortageRepository: ShortageRepository,
        userRepository: UserRepository,
        distribuidoraRepository: DistribuidoraRepository,
        emprestimoRepository: EmprestimoRepository,
      ) =>
        new ShortageUseCaseImpl(
          shortageRepository,
          userRepository,
          distribuidoraRepository,
          emprestimoRepository,
        ),
      inject: [SHORTAGE_REPOSITORY, USER_REPOSITORY, DISTRIBUIDORA_REPOSITORY, EMPRESTIMO_REPOSITORY],
    },
    {
      provide: DISTRIBUIDORA_USE_CASE,
      useFactory: (distribuidoraRepository: DistribuidoraRepository) =>
        new DistribuidoraUseCaseImpl(distribuidoraRepository),
      inject: [DISTRIBUIDORA_REPOSITORY],
    },
    {
      provide: EMPRESTIMO_USE_CASE,
      useFactory: (emprestimoRepository: EmprestimoRepository) =>
        new EmprestimoUseCaseImpl(emprestimoRepository),
      inject: [EMPRESTIMO_REPOSITORY],
    },
    {
      provide: TAREFA_USE_CASE,
      useFactory: (tarefaRepository: TarefaRepository) => new TarefaUseCaseImpl(tarefaRepository),
      inject: [TAREFA_REPOSITORY],
    },
  ],
  exports: [
    AUTH_USE_CASE,
    USER_MANAGEMENT_USE_CASE,
    SHORTAGE_USE_CASE,
    DISTRIBUIDORA_USE_CASE,
    EMPRESTIMO_USE_CASE,
    TAREFA_USE_CASE,
  ],
})
export class DomainModule {}

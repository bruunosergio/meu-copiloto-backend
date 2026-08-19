import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../infra/database/prisma.module';
import {
  PrismaDistribuidoraRepository,
  PrismaShortageRepository,
  PrismaStoreRepository,
  PrismaUserRepository,
} from '../../infra/repositories';
import { BcryptPasswordHasher, JwtTokenProvider } from '../../infra/security';
import {
  DISTRIBUIDORA_REPOSITORY,
  PASSWORD_HASHER,
  SHORTAGE_REPOSITORY,
  STORE_REPOSITORY,
  TOKEN_PROVIDER,
  USER_REPOSITORY,
} from '../../domain/ports/output';

/**
 * Unico modulo que conhece as implementacoes concretas de infra.
 * Expoe apenas os tokens das portas de saida — quem consome nunca importa
 * PrismaUserRepository, BcryptPasswordHasher etc. diretamente.
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: STORE_REPOSITORY, useClass: PrismaStoreRepository },
    { provide: SHORTAGE_REPOSITORY, useClass: PrismaShortageRepository },
    { provide: DISTRIBUIDORA_REPOSITORY, useClass: PrismaDistribuidoraRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_PROVIDER, useClass: JwtTokenProvider },
  ],
  exports: [
    USER_REPOSITORY,
    STORE_REPOSITORY,
    SHORTAGE_REPOSITORY,
    DISTRIBUIDORA_REPOSITORY,
    PASSWORD_HASHER,
    TOKEN_PROVIDER,
  ],
})
export class InfraModule {}

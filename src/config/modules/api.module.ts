import { Module } from '@nestjs/common';
import { DomainModule } from './domain.module';
import { InfraModule } from './infra.module';
import { AuthController } from '../../api/rest/auth/auth.controller';
import { UsersController } from '../../api/rest/users/users.controller';
import { ShortagesController } from '../../api/rest/shortages/shortages.controller';
import { DistribuidorasController } from '../../api/rest/distribuidoras/distribuidoras.controller';
import { EmprestimosController } from '../../api/rest/emprestimos/emprestimos.controller';
import { TarefasController } from '../../api/rest/tarefas/tarefas.controller';
import { HealthController } from '../../api/rest/health/health.controller';

@Module({
  imports: [DomainModule, InfraModule],
  controllers: [
    AuthController,
    UsersController,
    ShortagesController,
    DistribuidorasController,
    EmprestimosController,
    TarefasController,
    HealthController,
  ],
})
export class ApiModule {}

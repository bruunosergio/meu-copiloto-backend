import { Module } from '@nestjs/common';
import { DomainModule } from './domain.module';
import { InfraModule } from './infra.module';
import { AuthController } from '../../api/rest/auth/auth.controller';
import { UsersController } from '../../api/rest/users/users.controller';
import { ShortagesController } from '../../api/rest/shortages/shortages.controller';

@Module({
  imports: [DomainModule, InfraModule],
  controllers: [AuthController, UsersController, ShortagesController],
})
export class ApiModule {}

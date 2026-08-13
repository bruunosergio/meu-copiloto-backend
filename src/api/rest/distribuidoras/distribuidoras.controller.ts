import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../domain/entities';
import { DISTRIBUIDORA_USE_CASE, DistribuidoraUseCase } from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser, Roles, RolesGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { CreateDistribuidoraDto } from './create-distribuidora.dto';

@Controller('distribuidoras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistribuidorasController {
  constructor(
    @Inject(DISTRIBUIDORA_USE_CASE) private readonly distribuidoraUseCase: DistribuidoraUseCase,
  ) {}

  /**
   * Qualquer usuario autenticado da loja pode listar (o comprador precisa
   * disto no seletor rapido ao marcar uma falta como comprada).
   */
  @Get()
  async list(@CurrentUser() currentUser: RequestUser) {
    const result = await this.distribuidoraUseCase.listByStore(currentUser.storeId);
    const distribuidoras = unwrapOrThrow(result);
    return distribuidoras.map((distribuidora) => distribuidora.toPublic());
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateDistribuidoraDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.distribuidoraUseCase.create({
      storeId: currentUser.storeId,
      nome: dto.nome,
    });
    const distribuidora = unwrapOrThrow(result);
    return distribuidora.toPublic();
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  async deactivate(@Param('id') id: string) {
    const result = await this.distribuidoraUseCase.setAtiva(id, false);
    const distribuidora = unwrapOrThrow(result);
    return distribuidora.toPublic();
  }

  @Patch(':id/reactivate')
  @Roles(Role.ADMIN)
  async reactivate(@Param('id') id: string) {
    const result = await this.distribuidoraUseCase.setAtiva(id, true);
    const distribuidora = unwrapOrThrow(result);
    return distribuidora.toPublic();
  }
}

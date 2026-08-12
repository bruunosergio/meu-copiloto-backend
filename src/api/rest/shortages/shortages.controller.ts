import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, Shortage, ShortageOrigin, ShortageStatus } from '../../../domain/entities';
import { SHORTAGE_USE_CASE, ShortageUseCase } from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser, RolesGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { CancelShortageDto } from './cancel-shortage.dto';
import { CreateShortageDto } from './create-shortage.dto';
import { TransitionShortageDto } from './transition-shortage.dto';

@Controller('shortages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShortagesController {
  constructor(@Inject(SHORTAGE_USE_CASE) private readonly shortageUseCase: ShortageUseCase) {}

  @Post()
  async register(@Body() dto: CreateShortageDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.shortageUseCase.register({
      storeId: currentUser.storeId,
      codigoPeca: dto.codigoPeca ?? null,
      nomePeca: dto.nomePeca,
      qtdRestante: dto.qtdRestante,
      observacao: dto.observacao ?? null,
      registradoPorId: currentUser.sub,
      origem: ShortageOrigin.WEB,
    });
    return this.toResponse(unwrapOrThrow(result));
  }

  /**
   * Fila do comprador: vendedor ve apenas as proprias faltas;
   * admin/comprador veem a fila completa da loja.
   */
  @Get()
  async list(
    @CurrentUser() currentUser: RequestUser,
    @Query('status') status?: string,
  ) {
    const statusFiltro = status
      ? (status.split(',') as ShortageStatus[])
      : undefined;

    const apenasDoUsuarioId =
      currentUser.papel === Role.VENDEDOR ? currentUser.sub : undefined;

    const result = await this.shortageUseCase.list({
      storeId: currentUser.storeId,
      status: statusFiltro,
      apenasDoUsuarioId,
    });

    return unwrapOrThrow(result).map((shortage) => this.toResponse(shortage));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.shortageUseCase.getById(id);
    return this.toResponse(unwrapOrThrow(result));
  }

  @Patch(':id/status')
  async transition(
    @Param('id') id: string,
    @Body() dto: TransitionShortageDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const result = await this.shortageUseCase.transition({
      shortageId: id,
      novoStatus: dto.novoStatus,
      executadoPorId: currentUser.sub,
      motivo: dto.motivo,
    });
    return this.toResponse(unwrapOrThrow(result));
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelShortageDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const result = await this.shortageUseCase.cancel({
      shortageId: id,
      executadoPorId: currentUser.sub,
      motivo: dto.motivo,
    });
    return this.toResponse(unwrapOrThrow(result));
  }

  private toResponse(shortage: Shortage) {
    return shortage.toPublic();
  }
}

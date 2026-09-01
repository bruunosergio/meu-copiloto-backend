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
import { BatchTransitionDto } from './batch-transition.dto';
import { CancelShortageDto } from './cancel-shortage.dto';
import { CreateShortageDto } from './create-shortage.dto';
import { SetDistribuidoraDto } from './set-distribuidora.dto';
import { TransitionShortageDto } from './transition-shortage.dto';
import { UpdateShortageDto } from './update-shortage.dto';

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
      emprestada: dto.emprestada ?? false,
      emprestadaDe: dto.emprestadaDe ?? null,
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

  @Get('similares')
  async similares(
    @CurrentUser() currentUser: RequestUser,
    @Query('nome') nome?: string,
    @Query('codigo') codigo?: string,
    @Query('ignorarId') ignorarId?: string,
  ) {
    const result = await this.shortageUseCase.findSimilares({
      storeId: currentUser.storeId,
      nomePeca: nome ?? '',
      codigoPeca: codigo ?? null,
      ignorarShortageId: ignorarId,
    });
    return unwrapOrThrow(result).map((shortage) => this.toResponse(shortage));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.shortageUseCase.getById(id);
    return this.toResponse(unwrapOrThrow(result));
  }

  /**
   * Transicao em lote: comprador seleciona varias faltas e conclui todas de
   * uma vez com a mesma distribuidora (um pedido cobre varias pecas).
   */
  @Patch('status')
  async transitionMany(@Body() dto: BatchTransitionDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.shortageUseCase.transitionMany({
      shortageIds: dto.ids,
      novoStatus: dto.novoStatus,
      executadoPorId: currentUser.sub,
      distribuidoraId: dto.distribuidoraId,
      motivo: dto.motivo,
    });
    return unwrapOrThrow(result).map((shortage) => this.toResponse(shortage));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShortageDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const result = await this.shortageUseCase.update({
      shortageId: id,
      executadoPorId: currentUser.sub,
      codigoPeca: dto.codigoPeca,
      nomePeca: dto.nomePeca,
      qtdRestante: dto.qtdRestante,
      observacao: dto.observacao,
      emprestada: dto.emprestada,
      emprestadaDe: dto.emprestadaDe,
    });
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
      distribuidoraId: dto.distribuidoraId,
    });
    return this.toResponse(unwrapOrThrow(result));
  }

  /**
   * Define/corrige a distribuidora vencedora fora do momento da transicao
   * (ex.: comprador pulou a escolha e quer preencher depois).
   */
  @Patch(':id/distribuidora')
  async setDistribuidora(
    @Param('id') id: string,
    @Body() dto: SetDistribuidoraDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const result = await this.shortageUseCase.setDistribuidora({
      shortageId: id,
      distribuidoraId: dto.distribuidoraId ?? null,
      executadoPorId: currentUser.sub,
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

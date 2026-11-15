import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../domain/entities';
import { COBRANCA_USE_CASE, CobrancaUseCase } from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser, Roles, RolesGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import {
  CreateCobrancaRegraDto,
  ImportCobrancaDto,
  UpdateCobrancaClienteDto,
  UpdateCobrancaConfigDto,
} from './cobranca.dtos';

@Controller('cobrancas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GERENTE)
export class CobrancasController {
  constructor(@Inject(COBRANCA_USE_CASE) private readonly cobrancaUseCase: CobrancaUseCase) {}

  @Get()
  async getPainel(@CurrentUser() currentUser: RequestUser) {
    return unwrapOrThrow(await this.cobrancaUseCase.getPainel(currentUser.storeId));
  }

  @Post('importar')
  async importar(@Body() dto: ImportCobrancaDto, @CurrentUser() currentUser: RequestUser) {
    return unwrapOrThrow(
      await this.cobrancaUseCase.importar({
        storeId: currentUser.storeId,
        importadoPorId: currentUser.sub,
        referencia: dto.referencia,
        fonte: dto.fonte,
        clientes: dto.clientes,
      }),
    );
  }

  @Patch('config')
  async atualizarConfig(@Body() dto: UpdateCobrancaConfigDto, @CurrentUser() currentUser: RequestUser) {
    return unwrapOrThrow(
      await this.cobrancaUseCase.atualizarConfig({
        storeId: currentUser.storeId,
        dddPadrao: dto.dddPadrao,
      }),
    );
  }

  @Post('regras')
  async criarRegra(@Body() dto: CreateCobrancaRegraDto, @CurrentUser() currentUser: RequestUser) {
    return unwrapOrThrow(
      await this.cobrancaUseCase.criarRegra({
        storeId: currentUser.storeId,
        tipo: dto.tipo,
        codigoCliente: dto.codigoCliente,
        nomeContem: dto.nomeContem,
      }),
    );
  }

  @Delete('regras/:id')
  async excluirRegra(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
    unwrapOrThrow(await this.cobrancaUseCase.excluirRegra(id, currentUser.storeId));
    return { ok: true };
  }

  @Patch('clientes/:codigo')
  async atualizarCliente(
    @Param('codigo') codigo: string,
    @Body() dto: UpdateCobrancaClienteDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return unwrapOrThrow(
      await this.cobrancaUseCase.atualizarCliente({
        storeId: currentUser.storeId,
        codigo,
        ...(dto.telefone !== undefined && { telefone: dto.telefone }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.promessa !== undefined && { promessa: dto.promessa }),
        ...(dto.anotacao !== undefined && { anotacao: dto.anotacao }),
      }),
    );
  }
}

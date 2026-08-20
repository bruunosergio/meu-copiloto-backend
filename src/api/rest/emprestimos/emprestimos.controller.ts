import { Body, Controller, Get, Inject, Patch, Query, UseGuards } from '@nestjs/common';
import { Emprestimo, EmprestimoStatus } from '../../../domain/entities';
import { EMPRESTIMO_USE_CASE, EmprestimoUseCase } from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { DevolverEmprestimosDto } from './devolver-emprestimos.dto';

/**
 * Emprestimos de pecas de lojas parceiras. Acessivel a todos os papeis:
 * quem devolve fisicamente a peca (inclusive vendedor no terminal) marca a
 * devolucao no sistema.
 */
@Controller('emprestimos')
@UseGuards(JwtAuthGuard)
export class EmprestimosController {
  constructor(
    @Inject(EMPRESTIMO_USE_CASE) private readonly emprestimoUseCase: EmprestimoUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() currentUser: RequestUser, @Query('status') status?: string) {
    const result = await this.emprestimoUseCase.list({
      storeId: currentUser.storeId,
      status: status ? (status as EmprestimoStatus) : undefined,
    });
    return unwrapOrThrow(result).map((emprestimo) => this.toResponse(emprestimo));
  }

  @Patch('devolver')
  async devolver(@Body() dto: DevolverEmprestimosDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.emprestimoUseCase.devolver({
      ids: dto.ids,
      storeId: currentUser.storeId,
      executadoPorId: currentUser.sub,
      devolvidoPara: dto.devolvidoPara,
    });
    return unwrapOrThrow(result).map((emprestimo) => this.toResponse(emprestimo));
  }

  private toResponse(emprestimo: Emprestimo) {
    return emprestimo.toPublic();
  }
}

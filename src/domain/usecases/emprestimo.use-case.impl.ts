import { Result } from '../core/result';
import {
  Failure,
  NotFoundFailure,
  UnexpectedFailure,
  ValidationFailure,
} from '../failures';
import {
  DevolverEmprestimosInput,
  EmprestimoUseCase,
  ListEmprestimosInput,
} from '../ports/input';
import { EmprestimoRepository } from '../ports/output';
import { Emprestimo } from '../entities';

export class EmprestimoUseCaseImpl implements EmprestimoUseCase {
  constructor(private readonly emprestimoRepository: EmprestimoRepository) {}

  async list(input: ListEmprestimosInput): Promise<Result<Emprestimo[], Failure>> {
    try {
      const emprestimos = await this.emprestimoRepository.listByStore(input.storeId, input.status);
      return Result.ok(emprestimos);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /**
   * Devolucao em lote. Valida tudo antes de aplicar: todos os emprestimos
   * precisam existir, pertencer a loja e estar PENDENTE.
   */
  async devolver(input: DevolverEmprestimosInput): Promise<Result<Emprestimo[], Failure>> {
    try {
      if (input.ids.length === 0) {
        return Result.error(new ValidationFailure('Selecione ao menos um emprestimo.'));
      }
      if (!input.devolvidoPara.trim()) {
        return Result.error(
          new ValidationFailure('Informe a quem a(s) peca(s) foi(ram) devolvida(s).'),
        );
      }

      const emprestimos = await this.emprestimoRepository.findByIds(input.ids);
      const porId = new Map(emprestimos.map((e) => [e.id, e]));
      for (const id of input.ids) {
        const emprestimo = porId.get(id);
        if (!emprestimo || emprestimo.storeId !== input.storeId) {
          return Result.error(new NotFoundFailure('Emprestimo', id));
        }
        if (!emprestimo.isPendente()) {
          return Result.error(new ValidationFailure('Um dos emprestimos ja foi devolvido.'));
        }
      }

      const devolvidos = await this.emprestimoRepository.devolver({
        ids: input.ids,
        devolvidoPorId: input.executadoPorId,
        devolvidoPara: input.devolvidoPara.trim(),
      });
      return Result.ok(devolvidos);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }
}

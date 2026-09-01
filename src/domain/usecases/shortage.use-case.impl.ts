import { Result } from '../core/result';
import {
  Failure,
  InvalidTransitionFailure,
  NotFoundFailure,
  UnauthorizedFailure,
  UnexpectedFailure,
  ValidationFailure,
} from '../failures';
import {
  CancelShortageInput,
  FindSimilaresInput,
  ListShortagesInput,
  RegisterShortageInput,
  SetShortageDistribuidoraInput,
  ShortageUseCase,
  TransitionManyShortagesInput,
  TransitionShortageInput,
  UpdateShortageInput,
} from '../ports/input';
import { nomesParecidos } from '../peca-similaridade';
import { User } from '../entities';
import {
  DistribuidoraRepository,
  EmprestimoRepository,
  ShortageRepository,
  UserRepository,
} from '../ports/output';
import { Role, Shortage, ShortageStatus } from '../entities';

export class ShortageUseCaseImpl implements ShortageUseCase {
  constructor(
    private readonly shortageRepository: ShortageRepository,
    private readonly userRepository: UserRepository,
    private readonly distribuidoraRepository: DistribuidoraRepository,
    private readonly emprestimoRepository: EmprestimoRepository,
  ) {}

  async register(input: RegisterShortageInput): Promise<Result<Shortage, Failure>> {
    try {
      if (input.qtdRestante < 0) {
        return Result.error(new ValidationFailure('A quantidade restante nao pode ser negativa.'));
      }
      if (!input.nomePeca.trim()) {
        return Result.error(new ValidationFailure('O nome da peca e obrigatorio.'));
      }

      // Codigo/nome sempre em maiusculas: evita duplicidade por capitalizacao
      // diferente (ex.: "fr-5548" x "FR-5548") e casa com a convencao de
      // codigo de peca de autopecas. Aplicado aqui (dominio) para valer
      // tambem na entrada futura por WhatsApp/IA, nao so no formulario web.
      const codigoPeca = input.codigoPeca?.trim() ? input.codigoPeca.trim().toUpperCase() : null;
      const nomePeca = input.nomePeca.trim().toUpperCase();

      const shortage = await this.shortageRepository.create({
        storeId: input.storeId,
        codigoPeca,
        nomePeca,
        qtdRestante: input.qtdRestante,
        observacao: input.observacao,
        registradoPorId: input.registradoPorId,
        origem: input.origem,
      });

      await this.shortageRepository.recordTransition({
        shortageId: shortage.id,
        de: null,
        para: ShortageStatus.REGISTRADA,
        executadaPorId: input.registradoPorId,
        motivo: null,
      });

      // Peca emprestada de parceiro: entra na lista de emprestimos junto com
      // a falta, para o controle de devolucao (ver docs/02-modelo-dominio.md).
      if (input.emprestada) {
        await this.emprestimoRepository.create({
          storeId: input.storeId,
          shortageId: shortage.id,
          emprestadaDe: input.emprestadaDe?.trim() ? input.emprestadaDe.trim() : null,
          registradoPorId: input.registradoPorId,
        });
      }

      return Result.ok(shortage);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async list(input: ListShortagesInput): Promise<Result<Shortage[], Failure>> {
    try {
      const shortages = await this.shortageRepository.list({
        storeId: input.storeId,
        status: input.status,
        registradoPorId: input.apenasDoUsuarioId,
      });
      return Result.ok(shortages);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async getById(id: string): Promise<Result<Shortage, Failure>> {
    try {
      const shortage = await this.shortageRepository.findById(id);
      if (!shortage) {
        return Result.error(new NotFoundFailure('Falta', id));
      }
      return Result.ok(shortage);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async findSimilares(input: FindSimilaresInput): Promise<Result<Shortage[], Failure>> {
    try {
      const abertas = await this.shortageRepository.list({
        storeId: input.storeId,
        status: [ShortageStatus.REGISTRADA, ShortageStatus.CONCLUIDA],
      });
      const codigo = input.codigoPeca?.trim() ? input.codigoPeca.trim().toUpperCase() : null;
      const nome = input.nomePeca.trim();
      const similares = abertas.filter((shortage) => {
        if (input.ignorarShortageId && shortage.id === input.ignorarShortageId) {
          return false;
        }
        const codigoIgual = !!codigo && !!shortage.codigoPeca && shortage.codigoPeca === codigo;
        return codigoIgual || nomesParecidos(shortage.nomePeca, nome);
      });
      return Result.ok(similares);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async update(input: UpdateShortageInput): Promise<Result<Shortage, Failure>> {
    try {
      const shortage = await this.shortageRepository.findById(input.shortageId);
      if (!shortage) {
        return Result.error(new NotFoundFailure('Falta', input.shortageId));
      }

      const executor = await this.userRepository.findById(input.executadoPorId);
      if (!executor) {
        return Result.error(new UnauthorizedFailure());
      }
      if (!this.podeEditarRegistrada(executor, shortage)) {
        return Result.error(
          new UnauthorizedFailure('Voce so pode editar as proprias faltas enquanto estiverem REGISTRADA.'),
        );
      }
      if (shortage.status !== ShortageStatus.REGISTRADA) {
        return Result.error(new ValidationFailure('So e possivel editar uma falta ainda REGISTRADA.'));
      }
      if (input.qtdRestante !== undefined && input.qtdRestante < 0) {
        return Result.error(new ValidationFailure('A quantidade restante nao pode ser negativa.'));
      }
      if (input.nomePeca !== undefined && !input.nomePeca.trim()) {
        return Result.error(new ValidationFailure('O nome da peca e obrigatorio.'));
      }

      const codigoPeca =
        input.codigoPeca === undefined
          ? undefined
          : input.codigoPeca?.trim()
            ? input.codigoPeca.trim().toUpperCase()
            : null;
      const nomePeca = input.nomePeca !== undefined ? input.nomePeca.trim().toUpperCase() : undefined;

      const atualizada = await this.shortageRepository.update(shortage.id, {
        codigoPeca,
        nomePeca,
        qtdRestante: input.qtdRestante,
        observacao: input.observacao,
      });

      if (input.emprestada === true) {
        const emprestimo = await this.emprestimoRepository.findByShortageId(shortage.id);
        if (!emprestimo) {
          await this.emprestimoRepository.create({
            storeId: shortage.storeId,
            shortageId: shortage.id,
            emprestadaDe: input.emprestadaDe?.trim() ? input.emprestadaDe.trim() : null,
            registradoPorId: input.executadoPorId,
          });
        }
      }
      if (input.emprestada === false) {
        await this.apagarEmprestimoPendente(shortage.id);
      }

      return Result.ok(atualizada);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /**
   * Transicoes operacionais (conclusao da compra, recebimento).
   * Cancelamento tem regras proprias — ver cancel().
   */
  async transition(input: TransitionShortageInput): Promise<Result<Shortage, Failure>> {
    try {
      if (input.novoStatus === ShortageStatus.CANCELADA) {
        return Result.error(
          new ValidationFailure('Use a operacao de cancelamento para mover uma falta para CANCELADA.'),
        );
      }

      const shortage = await this.shortageRepository.findById(input.shortageId);
      if (!shortage) {
        return Result.error(new NotFoundFailure('Falta', input.shortageId));
      }

      const executor = await this.userRepository.findById(input.executadoPorId);
      if (!executor) {
        return Result.error(new UnauthorizedFailure());
      }

      if (!executor.podeGerenciarFilaCompleta()) {
        return Result.error(
          new UnauthorizedFailure('Apenas administradores, compradores e gerentes podem conduzir a compra.'),
        );
      }

      if (!shortage.podeTransicionarPara(input.novoStatus)) {
        return Result.error(new InvalidTransitionFailure(shortage.status, input.novoStatus));
      }

      if (input.distribuidoraId) {
        if (input.novoStatus !== ShortageStatus.CONCLUIDA) {
          return Result.error(
            new ValidationFailure(
              'A distribuidora so pode ser definida ao marcar a falta como concluida.',
            ),
          );
        }

        const distribuidora = await this.distribuidoraRepository.findById(input.distribuidoraId);
        if (!distribuidora || distribuidora.storeId !== shortage.storeId) {
          return Result.error(new NotFoundFailure('Distribuidora', input.distribuidoraId));
        }
        if (!distribuidora.ativa) {
          return Result.error(new ValidationFailure('Esta distribuidora esta inativa.'));
        }
      }

      const atualizada = await this.shortageRepository.updateStatus(
        shortage.id,
        input.novoStatus,
        input.distribuidoraId,
      );

      await this.shortageRepository.recordTransition({
        shortageId: shortage.id,
        de: shortage.status,
        para: input.novoStatus,
        executadaPorId: input.executadoPorId,
        motivo: input.motivo ?? null,
      });

      return Result.ok(atualizada);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /**
   * Transicao em lote: um pedido em uma distribuidora costuma cobrir varias
   * pecas de uma vez. Valida todas as faltas antes de aplicar qualquer
   * mudanca — se uma falhar na validacao, nada e alterado.
   */
  async transitionMany(input: TransitionManyShortagesInput): Promise<Result<Shortage[], Failure>> {
    try {
      if (input.shortageIds.length === 0) {
        return Result.error(new ValidationFailure('Selecione ao menos uma falta.'));
      }
      if (input.novoStatus === ShortageStatus.CANCELADA) {
        return Result.error(
          new ValidationFailure('Use a operacao de cancelamento para mover faltas para CANCELADA.'),
        );
      }

      const executor = await this.userRepository.findById(input.executadoPorId);
      if (!executor) {
        return Result.error(new UnauthorizedFailure());
      }
      if (!executor.podeGerenciarFilaCompleta()) {
        return Result.error(
          new UnauthorizedFailure('Apenas administradores, compradores e gerentes podem conduzir a compra.'),
        );
      }

      const shortages: Shortage[] = [];
      for (const shortageId of input.shortageIds) {
        const shortage = await this.shortageRepository.findById(shortageId);
        if (!shortage) {
          return Result.error(new NotFoundFailure('Falta', shortageId));
        }
        if (shortage.storeId !== executor.storeId) {
          return Result.error(new NotFoundFailure('Falta', shortageId));
        }
        if (!shortage.podeTransicionarPara(input.novoStatus)) {
          return Result.error(new InvalidTransitionFailure(shortage.status, input.novoStatus));
        }
        shortages.push(shortage);
      }

      if (input.distribuidoraId) {
        if (input.novoStatus !== ShortageStatus.CONCLUIDA) {
          return Result.error(
            new ValidationFailure(
              'A distribuidora so pode ser definida ao marcar as faltas como concluidas.',
            ),
          );
        }
        const distribuidora = await this.distribuidoraRepository.findById(input.distribuidoraId);
        if (!distribuidora || distribuidora.storeId !== executor.storeId) {
          return Result.error(new NotFoundFailure('Distribuidora', input.distribuidoraId));
        }
        if (!distribuidora.ativa) {
          return Result.error(new ValidationFailure('Esta distribuidora esta inativa.'));
        }
      }

      const atualizadas: Shortage[] = [];
      for (const shortage of shortages) {
        const atualizada = await this.shortageRepository.updateStatus(
          shortage.id,
          input.novoStatus,
          input.distribuidoraId,
        );
        await this.shortageRepository.recordTransition({
          shortageId: shortage.id,
          de: shortage.status,
          para: input.novoStatus,
          executadaPorId: input.executadoPorId,
          motivo: input.motivo ?? null,
        });
        atualizadas.push(atualizada);
      }

      return Result.ok(atualizadas);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  /**
   * Define ou corrige a distribuidora vencedora fora do momento da transicao
   * (ex.: comprador pulou a escolha ao marcar como concluida e quer preencher
   * depois, ou precisa trocar por engano). Nao exige mudanca de status.
   */
  async setDistribuidora(
    input: SetShortageDistribuidoraInput,
  ): Promise<Result<Shortage, Failure>> {
    try {
      const shortage = await this.shortageRepository.findById(input.shortageId);
      if (!shortage) {
        return Result.error(new NotFoundFailure('Falta', input.shortageId));
      }

      const executor = await this.userRepository.findById(input.executadoPorId);
      if (!executor) {
        return Result.error(new UnauthorizedFailure());
      }

      if (!executor.podeGerenciarFilaCompleta()) {
        return Result.error(
          new UnauthorizedFailure('Apenas administradores, compradores e gerentes podem definir a distribuidora.'),
        );
      }

      if (input.distribuidoraId) {
        const distribuidora = await this.distribuidoraRepository.findById(input.distribuidoraId);
        if (!distribuidora || distribuidora.storeId !== shortage.storeId) {
          return Result.error(new NotFoundFailure('Distribuidora', input.distribuidoraId));
        }
        if (!distribuidora.ativa) {
          return Result.error(new ValidationFailure('Esta distribuidora esta inativa.'));
        }
      }

      const atualizada = await this.shortageRepository.setDistribuidora(
        shortage.id,
        input.distribuidoraId,
      );
      return Result.ok(atualizada);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async cancel(input: CancelShortageInput): Promise<Result<Shortage, Failure>> {
    try {
      if (!input.motivo.trim()) {
        return Result.error(new ValidationFailure('O motivo do cancelamento e obrigatorio.'));
      }

      const shortage = await this.shortageRepository.findById(input.shortageId);
      if (!shortage) {
        return Result.error(new NotFoundFailure('Falta', input.shortageId));
      }

      const executor = await this.userRepository.findById(input.executadoPorId);
      if (!executor) {
        return Result.error(new UnauthorizedFailure());
      }

      const podeCancel =
        executor.podeGerenciarFilaCompleta() ||
        (executor.papel === Role.VENDEDOR &&
          shortage.registradoPorId === executor.id &&
          shortage.status === ShortageStatus.REGISTRADA);

      if (!podeCancel) {
        return Result.error(
          new UnauthorizedFailure('Voce so pode cancelar as proprias faltas enquanto estiverem REGISTRADA.'),
        );
      }

      if (!shortage.podeTransicionarPara(ShortageStatus.CANCELADA)) {
        return Result.error(new InvalidTransitionFailure(shortage.status, ShortageStatus.CANCELADA));
      }

      const atualizada = await this.shortageRepository.updateStatus(
        shortage.id,
        ShortageStatus.CANCELADA,
      );

      await this.apagarEmprestimoPendente(shortage.id);

      await this.shortageRepository.recordTransition({
        shortageId: shortage.id,
        de: shortage.status,
        para: ShortageStatus.CANCELADA,
        executadaPorId: input.executadoPorId,
        motivo: input.motivo,
      });

      return Result.ok(atualizada);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  private podeEditarRegistrada(executor: User, shortage: Shortage): boolean {
    return (
      executor.podeGerenciarFilaCompleta() ||
      (executor.papel === Role.VENDEDOR && shortage.registradoPorId === executor.id)
    );
  }

  private async apagarEmprestimoPendente(shortageId: string): Promise<void> {
    const emprestimo = await this.emprestimoRepository.findByShortageId(shortageId);
    if (emprestimo?.isPendente()) {
      await this.emprestimoRepository.delete(emprestimo.id);
    }
  }
}

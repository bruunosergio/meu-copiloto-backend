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
  ListShortagesInput,
  RegisterShortageInput,
  ShortageUseCase,
  TransitionShortageInput,
} from '../ports/input';
import { ShortageRepository, UserRepository } from '../ports/output';
import { Role, Shortage, ShortageStatus } from '../entities';

export class ShortageUseCaseImpl implements ShortageUseCase {
  constructor(
    private readonly shortageRepository: ShortageRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterShortageInput): Promise<Result<Shortage, Failure>> {
    try {
      if (input.qtdRestante < 0) {
        return Result.error(new ValidationFailure('A quantidade restante nao pode ser negativa.'));
      }
      if (!input.nomePeca.trim()) {
        return Result.error(new ValidationFailure('O nome da peca e obrigatorio.'));
      }

      const shortage = await this.shortageRepository.create({
        storeId: input.storeId,
        codigoPeca: input.codigoPeca,
        nomePeca: input.nomePeca,
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

  /**
   * Transicoes operacionais (cotacao, compra, recebimento).
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
          new UnauthorizedFailure('Apenas administradores e compradores podem conduzir a cotacao e a compra.'),
        );
      }

      if (!shortage.podeTransicionarPara(input.novoStatus)) {
        return Result.error(new InvalidTransitionFailure(shortage.status, input.novoStatus));
      }

      const atualizada = await this.shortageRepository.updateStatus(shortage.id, input.novoStatus);

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
}

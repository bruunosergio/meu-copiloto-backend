import { Result } from '../core/result';
import { ConflictFailure, Failure, NotFoundFailure, UnexpectedFailure, ValidationFailure } from '../failures';
import { CreateDistribuidoraInput, DistribuidoraUseCase } from '../ports/input';
import { DistribuidoraRepository } from '../ports/output';
import { Distribuidora } from '../entities';

export class DistribuidoraUseCaseImpl implements DistribuidoraUseCase {
  constructor(private readonly distribuidoraRepository: DistribuidoraRepository) {}

  async create(input: CreateDistribuidoraInput): Promise<Result<Distribuidora, Failure>> {
    try {
      const nome = input.nome.trim();
      if (!nome) {
        return Result.error(new ValidationFailure('O nome da distribuidora e obrigatorio.'));
      }

      const existente = await this.distribuidoraRepository.findByNome(input.storeId, nome);
      if (existente) {
        return Result.error(new ConflictFailure(`Ja existe uma distribuidora chamada "${nome}".`));
      }

      const distribuidora = await this.distribuidoraRepository.create({
        storeId: input.storeId,
        nome,
      });

      return Result.ok(distribuidora);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async listByStore(storeId: string): Promise<Result<Distribuidora[], Failure>> {
    try {
      const distribuidoras = await this.distribuidoraRepository.listByStore(storeId);
      return Result.ok(distribuidoras);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async setAtiva(id: string, ativa: boolean): Promise<Result<Distribuidora, Failure>> {
    try {
      const existente = await this.distribuidoraRepository.findById(id);
      if (!existente) {
        return Result.error(new NotFoundFailure('Distribuidora', id));
      }

      const atualizada = await this.distribuidoraRepository.setAtiva(id, ativa);
      return Result.ok(atualizada);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }
}

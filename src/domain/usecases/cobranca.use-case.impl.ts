import { assemblePainel, DEFAULT_COBRANCA_REGRAS, namesToReopen, parseRef } from '../cobranca/ledger';
import { parseRawClients } from '../cobranca/raw-client';
import { Result } from '../core/result';
import {
  CobrancaAtencao,
  CobrancaPainel,
  CobrancaRegra,
  CobrancaStatus,
} from '../entities';
import {
  Failure,
  NotFoundFailure,
  UnexpectedFailure,
  ValidationFailure,
} from '../failures';
import {
  CobrancaUseCase,
  CreateCobrancaRegraInput,
  ImportCobrancaInput,
  UpdateCobrancaClienteInput,
  UpdateCobrancaConfigInput,
} from '../ports/input';
import { CobrancaRepository, StoreRepository } from '../ports/output';

const FONTES_PADRAO = 'Recebíveis em aberto por cliente';

export class CobrancaUseCaseImpl implements CobrancaUseCase {
  constructor(
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly storeRepository: StoreRepository,
  ) {}

  async getPainel(storeId: string): Promise<Result<CobrancaPainel, Failure>> {
    try {
      return Result.ok(await this.loadPainel(storeId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async importar(input: ImportCobrancaInput): Promise<Result<CobrancaPainel, Failure>> {
    try {
      try {
        parseRef(input.referencia);
      } catch {
        return Result.error(new ValidationFailure('A data de referencia do relatorio e invalida.'));
      }
      const clientes = parseRawClients(input.clientes);
      if (!clientes) {
        return Result.error(
          new ValidationFailure('O relatorio precisa ter ao menos um cliente com codigo, nome e notas.'),
        );
      }
      await this.ensureDefaults(input.storeId);
      await this.cobrancaRepository.saveRelatorio({
        storeId: input.storeId,
        referencia: input.referencia.trim(),
        fonte: input.fonte?.trim() || FONTES_PADRAO,
        clientes,
        importadoPorId: input.importadoPorId,
      });
      const painel = await this.loadPainel(input.storeId);
      const reabrir = painel.clientes.filter((client) => namesToReopen([client]).length > 0);
      if (reabrir.length) {
        await this.cobrancaRepository.resetPaidToCharge(
          input.storeId,
          reabrir.map((client) => client.code),
        );
      }
      return Result.ok(await this.loadPainel(input.storeId, reabrir.map((client) => client.name)));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async atualizarCliente(input: UpdateCobrancaClienteInput): Promise<Result<CobrancaPainel, Failure>> {
    try {
      const painel = await this.loadPainel(input.storeId);
      const cliente = painel.clientes.find((item) => item.code === input.codigo);
      if (!cliente) {
        return Result.error(new NotFoundFailure('Cliente', input.codigo));
      }
      if (input.status && !Object.values(CobrancaStatus).includes(input.status)) {
        return Result.error(new ValidationFailure('Status de cobranca invalido.'));
      }
      if (input.promessa !== undefined && input.promessa && !/^\d{4}-\d{2}-\d{2}$/.test(input.promessa)) {
        return Result.error(new ValidationFailure('A data da promessa precisa ser AAAA-MM-DD.'));
      }
      await this.cobrancaRepository.upsertAcompanhamento({
        storeId: input.storeId,
        codigo: input.codigo,
        ...(input.telefone !== undefined && { telefoneOverride: input.telefone }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.promessa !== undefined && { promessa: input.promessa || null }),
        ...(input.anotacao !== undefined && { anotacao: input.anotacao }),
      });
      return Result.ok(await this.loadPainel(input.storeId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async atualizarConfig(input: UpdateCobrancaConfigInput): Promise<Result<CobrancaPainel, Failure>> {
    try {
      const ddd = input.dddPadrao.replace(/\D/g, '');
      if (ddd.length !== 2) {
        return Result.error(new ValidationFailure('Informe um DDD com 2 digitos.'));
      }
      await this.cobrancaRepository.upsertConfig(input.storeId, ddd);
      return Result.ok(await this.loadPainel(input.storeId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async criarRegra(input: CreateCobrancaRegraInput): Promise<Result<CobrancaRegra, Failure>> {
    try {
      if (!Object.values(CobrancaAtencao).includes(input.tipo)) {
        return Result.error(new ValidationFailure('Tipo de excecao invalido.'));
      }
      const codigoCliente = input.codigoCliente?.trim() || null;
      const nomeContem = input.nomeContem?.trim() || null;
      if (!codigoCliente && !nomeContem) {
        return Result.error(new ValidationFailure('Informe o codigo do cliente ou um trecho do nome.'));
      }
      await this.ensureDefaults(input.storeId);
      const regra = await this.cobrancaRepository.createRegra({
        storeId: input.storeId,
        tipo: input.tipo,
        codigoCliente,
        nomeContem,
      });
      return Result.ok(regra);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async excluirRegra(regraId: string, storeId: string): Promise<Result<void, Failure>> {
    try {
      const ok = await this.cobrancaRepository.deleteRegra(regraId, storeId);
      if (!ok) return Result.error(new NotFoundFailure('Regra', regraId));
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  private async loadPainel(storeId: string, reabertos: string[] = []): Promise<CobrancaPainel> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new Error(`Loja nao encontrada: ${storeId}`);
    await this.ensureDefaults(storeId);
    const [relatorio, config, regras, acompanhamentos] = await Promise.all([
      this.cobrancaRepository.findRelatorio(storeId),
      this.cobrancaRepository.findConfig(storeId),
      this.cobrancaRepository.listRegras(storeId),
      this.cobrancaRepository.listAcompanhamentos(storeId),
    ]);
    return assemblePainel({
      lojaNome: store.nome,
      dddPadrao: config?.dddPadrao ?? '82',
      relatorio,
      regras,
      acompanhamentos,
      reabertos,
    });
  }

  private async ensureDefaults(storeId: string): Promise<void> {
    const [config, regras] = await Promise.all([
      this.cobrancaRepository.findConfig(storeId),
      this.cobrancaRepository.listRegras(storeId),
    ]);
    if (config) return;
    await this.cobrancaRepository.upsertConfig(storeId, '82');
    if (regras.length === 0) {
      await this.cobrancaRepository.createRegras(
        DEFAULT_COBRANCA_REGRAS.map((regra) => ({
          storeId,
          tipo: regra.tipo,
          codigoCliente: regra.codigoCliente,
          nomeContem: regra.nomeContem,
        })),
      );
    }
  }
}

import {
  CobrancaAcompanhamento,
  CobrancaConfig,
  CobrancaRegra,
  CobrancaRelatorio,
  CobrancaStatus,
} from '../../entities';
import {
  CobrancaRepository,
  CreateCobrancaRegraData,
  SaveCobrancaRelatorioData,
  UpsertCobrancaAcompanhamentoData,
} from '../../ports/output';

export class FakeCobrancaRepository implements CobrancaRepository {
  relatorio: CobrancaRelatorio | null = null;
  config: CobrancaConfig | null = null;
  acompanhamentos: CobrancaAcompanhamento[] = [];
  regras: CobrancaRegra[] = [];
  private nextId = 1;

  async findRelatorio(storeId: string): Promise<CobrancaRelatorio | null> {
    return this.relatorio?.storeId === storeId ? this.relatorio : null;
  }

  async saveRelatorio(data: SaveCobrancaRelatorioData): Promise<CobrancaRelatorio> {
    this.relatorio = {
      id: this.relatorio?.id ?? `rel-${this.nextId++}`,
      storeId: data.storeId,
      referencia: data.referencia,
      fonte: data.fonte,
      clientes: data.clientes,
      importadoEm: new Date(),
      importadoPorId: data.importadoPorId,
    };
    return this.relatorio;
  }

  async listAcompanhamentos(storeId: string): Promise<CobrancaAcompanhamento[]> {
    return this.acompanhamentos.filter((item) => item.storeId === storeId);
  }

  async upsertAcompanhamento(data: UpsertCobrancaAcompanhamentoData): Promise<CobrancaAcompanhamento> {
    const index = this.acompanhamentos.findIndex(
      (item) => item.storeId === data.storeId && item.codigo === data.codigo,
    );
    const atual = index >= 0 ? this.acompanhamentos[index] : null;
    const next: CobrancaAcompanhamento = {
      id: atual?.id ?? `acomp-${this.nextId++}`,
      storeId: data.storeId,
      codigo: data.codigo,
      telefoneOverride:
        data.telefoneOverride !== undefined ? data.telefoneOverride : (atual?.telefoneOverride ?? null),
      status: data.status ?? atual?.status ?? CobrancaStatus.A_COBRAR,
      promessa: data.promessa !== undefined ? data.promessa : (atual?.promessa ?? null),
      anotacao: data.anotacao !== undefined ? data.anotacao : (atual?.anotacao ?? null),
      atualizadoEm: new Date(),
    };
    if (index >= 0) this.acompanhamentos[index] = next;
    else this.acompanhamentos.push(next);
    return next;
  }

  async resetPaidToCharge(storeId: string, codigos: string[]): Promise<void> {
    for (const item of this.acompanhamentos) {
      if (item.storeId === storeId && codigos.includes(item.codigo)) {
        item.status = CobrancaStatus.A_COBRAR;
      }
    }
  }

  async findConfig(storeId: string): Promise<CobrancaConfig | null> {
    return this.config?.storeId === storeId ? this.config : null;
  }

  async upsertConfig(storeId: string, dddPadrao: string): Promise<CobrancaConfig> {
    this.config = {
      id: this.config?.id ?? `cfg-${this.nextId++}`,
      storeId,
      dddPadrao,
    };
    return this.config;
  }

  async listRegras(storeId: string): Promise<CobrancaRegra[]> {
    return this.regras.filter((item) => item.storeId === storeId);
  }

  async createRegras(data: CreateCobrancaRegraData[]): Promise<CobrancaRegra[]> {
    for (const item of data) {
      await this.createRegra(item);
    }
    return this.listRegras(data[0]?.storeId ?? '');
  }

  async createRegra(data: CreateCobrancaRegraData): Promise<CobrancaRegra> {
    const regra: CobrancaRegra = {
      id: `regra-${this.nextId++}`,
      storeId: data.storeId,
      tipo: data.tipo,
      codigoCliente: data.codigoCliente,
      nomeContem: data.nomeContem,
      criadoEm: new Date(),
    };
    this.regras.push(regra);
    return regra;
  }

  async deleteRegra(id: string, storeId: string): Promise<boolean> {
    const before = this.regras.length;
    this.regras = this.regras.filter((item) => !(item.id === id && item.storeId === storeId));
    return this.regras.length < before;
  }
}

import { CreateDistribuidoraData, DistribuidoraRepository } from '../../ports/output';
import { Distribuidora } from '../../entities';

export class FakeDistribuidoraRepository implements DistribuidoraRepository {
  private distribuidoras: Distribuidora[] = [];
  private nextId = 1;

  async findById(id: string): Promise<Distribuidora | null> {
    return this.distribuidoras.find((d) => d.id === id) ?? null;
  }

  async findByNome(storeId: string, nome: string): Promise<Distribuidora | null> {
    return (
      this.distribuidoras.find(
        (d) => d.storeId === storeId && d.nome.toLowerCase() === nome.toLowerCase(),
      ) ?? null
    );
  }

  async listByStore(storeId: string): Promise<Distribuidora[]> {
    return this.distribuidoras.filter((d) => d.storeId === storeId);
  }

  async create(data: CreateDistribuidoraData): Promise<Distribuidora> {
    const distribuidora = new Distribuidora({
      id: `distribuidora-${this.nextId++}`,
      storeId: data.storeId,
      nome: data.nome,
      ativa: true,
      criadaEm: new Date(),
      atualizadaEm: new Date(),
    });
    this.distribuidoras.push(distribuidora);
    return distribuidora;
  }

  async setAtiva(id: string, ativa: boolean): Promise<Distribuidora> {
    const index = this.distribuidoras.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Distribuidora nao encontrada no fake repository.');
    const atual = this.distribuidoras[index];
    const atualizada = new Distribuidora({
      id: atual.id,
      storeId: atual.storeId,
      nome: atual.nome,
      ativa,
      criadaEm: atual.criadaEm,
      atualizadaEm: new Date(),
    });
    this.distribuidoras[index] = atualizada;
    return atualizada;
  }

  /** Util nos testes para popular distribuidoras sem passar pelo use case. */
  seed(distribuidora: Distribuidora) {
    this.distribuidoras.push(distribuidora);
  }
}

import {
  CreateEmprestimoData,
  DevolverEmprestimosData,
  EmprestimoRepository,
} from '../../ports/output';
import { Emprestimo, EmprestimoStatus } from '../../entities';

export class FakeEmprestimoRepository implements EmprestimoRepository {
  private emprestimos: Emprestimo[] = [];
  private nextId = 1;

  async create(data: CreateEmprestimoData): Promise<Emprestimo> {
    const emprestimo = new Emprestimo({
      id: `emprestimo-${this.nextId++}`,
      storeId: data.storeId,
      shortageId: data.shortageId,
      emprestadaDe: data.emprestadaDe,
      status: EmprestimoStatus.PENDENTE,
      registradoPorId: data.registradoPorId,
      devolvidoPorId: null,
      devolvidoPara: null,
      devolvidoEm: null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    this.emprestimos.push(emprestimo);
    return emprestimo;
  }

  async listByStore(storeId: string, status?: EmprestimoStatus): Promise<Emprestimo[]> {
    return this.emprestimos.filter(
      (e) => e.storeId === storeId && (!status || e.status === status),
    );
  }

  async findByIds(ids: string[]): Promise<Emprestimo[]> {
    return this.emprestimos.filter((e) => ids.includes(e.id));
  }

  async findByShortageId(shortageId: string): Promise<Emprestimo | null> {
    return this.emprestimos.find((e) => e.shortageId === shortageId) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.emprestimos = this.emprestimos.filter((e) => e.id !== id);
  }

  async devolver(data: DevolverEmprestimosData): Promise<Emprestimo[]> {
    const devolvidos: Emprestimo[] = [];
    for (const id of data.ids) {
      const index = this.emprestimos.findIndex((e) => e.id === id);
      if (index === -1) throw new Error('Emprestimo nao encontrado no fake repository.');
      const atual = this.emprestimos[index];
      const atualizado = new Emprestimo({
        id: atual.id,
        storeId: atual.storeId,
        shortageId: atual.shortageId,
        emprestadaDe: atual.emprestadaDe,
        status: EmprestimoStatus.DEVOLVIDA,
        registradoPorId: atual.registradoPorId,
        devolvidoPorId: data.devolvidoPorId,
        devolvidoPara: data.devolvidoPara,
        devolvidoEm: new Date(),
        criadoEm: atual.criadoEm,
        atualizadoEm: new Date(),
      });
      this.emprestimos[index] = atualizado;
      devolvidos.push(atualizado);
    }
    return devolvidos;
  }
}

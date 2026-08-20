import { Emprestimo, EmprestimoStatus } from '../../entities';

export interface CreateEmprestimoData {
  storeId: string;
  shortageId: string;
  emprestadaDe: string | null;
  registradoPorId: string;
}

export interface DevolverEmprestimosData {
  ids: string[];
  devolvidoPorId: string;
  devolvidoPara: string;
}

export interface EmprestimoRepository {
  create(data: CreateEmprestimoData): Promise<Emprestimo>;
  listByStore(storeId: string, status?: EmprestimoStatus): Promise<Emprestimo[]>;
  findByIds(ids: string[]): Promise<Emprestimo[]>;
  devolver(data: DevolverEmprestimosData): Promise<Emprestimo[]>;
}

export const EMPRESTIMO_REPOSITORY = 'EMPRESTIMO_REPOSITORY';

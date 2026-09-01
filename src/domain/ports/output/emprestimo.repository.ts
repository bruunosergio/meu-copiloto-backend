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
  findByShortageId(shortageId: string): Promise<Emprestimo | null>;
  delete(id: string): Promise<void>;
  devolver(data: DevolverEmprestimosData): Promise<Emprestimo[]>;
}

export const EMPRESTIMO_REPOSITORY = 'EMPRESTIMO_REPOSITORY';

import { Emprestimo as PrismaEmprestimo } from '@prisma/client';
import { Emprestimo, EmprestimoStatus } from '../../domain/entities';

type PrismaEmprestimoComRelacoes = PrismaEmprestimo & {
  shortage?: { nomePeca: string; codigoPeca: string | null; status: string };
  registradoPor?: { nome: string };
  devolvidoPor?: { nome: string } | null;
};

export class EmprestimoMapper {
  static toDomain(raw: PrismaEmprestimoComRelacoes): Emprestimo {
    return new Emprestimo({
      id: raw.id,
      storeId: raw.storeId,
      shortageId: raw.shortageId,
      emprestadaDe: raw.emprestadaDe,
      status: raw.status as EmprestimoStatus,
      registradoPorId: raw.registradoPorId,
      devolvidoPorId: raw.devolvidoPorId,
      devolvidoPara: raw.devolvidoPara,
      devolvidoEm: raw.devolvidoEm,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
      pecaNome: raw.shortage?.nomePeca ?? null,
      pecaCodigo: raw.shortage?.codigoPeca ?? null,
      faltaStatus: raw.shortage?.status ?? null,
      registradoPorNome: raw.registradoPor?.nome ?? null,
      devolvidoPorNome: raw.devolvidoPor?.nome ?? null,
    });
  }
}

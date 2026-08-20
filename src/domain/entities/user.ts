import { Role } from './role';

export interface UserProps {
  id: string;
  storeId: string;
  nome: string;
  email: string | null;
  senhaHash: string | null;
  usuario: string | null;
  pinHash: string | null;
  telefoneWhatsapp: string | null;
  papel: Role;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get email(): string | null {
    return this.props.email;
  }

  get senhaHash(): string | null {
    return this.props.senhaHash;
  }

  get usuario(): string | null {
    return this.props.usuario;
  }

  get pinHash(): string | null {
    return this.props.pinHash;
  }

  get telefoneWhatsapp(): string | null {
    return this.props.telefoneWhatsapp;
  }

  get papel(): Role {
    return this.props.papel;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get criadoEm(): Date {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date {
    return this.props.atualizadoEm;
  }

  isAdmin(): boolean {
    return this.props.papel === Role.ADMIN;
  }

  isComprador(): boolean {
    return this.props.papel === Role.COMPRADOR;
  }

  isVendedor(): boolean {
    return this.props.papel === Role.VENDEDOR;
  }

  isGerente(): boolean {
    return this.props.papel === Role.GERENTE;
  }

  /** Admin, comprador e gerente podem gerenciar a fila completa; vendedor so as proprias faltas. */
  podeGerenciarFilaCompleta(): boolean {
    return this.isAdmin() || this.isComprador() || this.isGerente();
  }

  /** Quadro de tarefas e restrito a gerente e admin. */
  podeGerenciarTarefas(): boolean {
    return this.isAdmin() || this.isGerente();
  }

  /**
   * ADMIN, COMPRADOR e GERENTE logam com e-mail+senha, de qualquer lugar.
   * VENDEDOR loga pela sessao da loja + usuario+PIN (ver ADR-0007).
   */
  usaLoginPessoal(): boolean {
    return !this.isVendedor();
  }

  toPublic() {
    return {
      id: this.id,
      storeId: this.storeId,
      nome: this.nome,
      email: this.email,
      usuario: this.usuario,
      telefoneWhatsapp: this.telefoneWhatsapp,
      papel: this.papel,
      ativo: this.ativo,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    };
  }
}

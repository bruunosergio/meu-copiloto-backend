export enum Role {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  COMPRADOR = 'COMPRADOR',
  /** Mesmas permissoes do COMPRADOR na fila + quadro de tarefas. */
  GERENTE = 'GERENTE',
}

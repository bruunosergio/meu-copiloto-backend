import { ShortageUseCaseImpl } from './shortage.use-case.impl';
import {
  FakeDistribuidoraRepository,
  FakeEmprestimoRepository,
  FakeShortageRepository,
  FakeUserRepository,
} from './__fakes__';
import {
  Distribuidora,
  EmprestimoStatus,
  Role,
  ShortageOrigin,
  ShortageStatus,
  User,
} from '../entities';
import {
  InvalidTransitionFailure,
  NotFoundFailure,
  UnauthorizedFailure,
  ValidationFailure,
} from '../failures';

describe('ShortageUseCaseImpl', () => {
  const storeId = 'store-1';
  let shortageRepository: FakeShortageRepository;
  let userRepository: FakeUserRepository;
  let distribuidoraRepository: FakeDistribuidoraRepository;
  let emprestimoRepository: FakeEmprestimoRepository;
  let useCase: ShortageUseCaseImpl;

  let vendedor: User;
  let outroVendedor: User;
  let comprador: User;
  let gerente: User;
  let ligpecas: Distribuidora;
  let distribuidoraInativa: Distribuidora;

  function makeUser(id: string, nome: string, papel: Role): User {
    const isVendedor = papel === Role.VENDEDOR;
    return new User({
      id,
      storeId,
      nome,
      email: isVendedor ? null : `${id}@loja.com`,
      senhaHash: isVendedor ? null : 'hash',
      usuario: isVendedor ? id : null,
      pinHash: isVendedor ? 'hash' : null,
      telefoneWhatsapp: null,
      papel,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
  }

  async function registrarFalta(nomePeca: string) {
    const result = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca,
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });
    return result.value;
  }

  beforeEach(() => {
    shortageRepository = new FakeShortageRepository();
    userRepository = new FakeUserRepository();
    distribuidoraRepository = new FakeDistribuidoraRepository();
    emprestimoRepository = new FakeEmprestimoRepository();
    useCase = new ShortageUseCaseImpl(
      shortageRepository,
      userRepository,
      distribuidoraRepository,
      emprestimoRepository,
    );

    ligpecas = new Distribuidora({
      id: 'distribuidora-1',
      storeId,
      nome: 'LIGPECAS',
      ativa: true,
      criadaEm: new Date(),
      atualizadaEm: new Date(),
    });
    distribuidoraInativa = new Distribuidora({
      id: 'distribuidora-2',
      storeId,
      nome: 'DPK',
      ativa: false,
      criadaEm: new Date(),
      atualizadaEm: new Date(),
    });
    distribuidoraRepository.seed(ligpecas);
    distribuidoraRepository.seed(distribuidoraInativa);

    vendedor = makeUser('vendedor-1', 'Vendedor A', Role.VENDEDOR);
    outroVendedor = makeUser('vendedor-2', 'Vendedor B', Role.VENDEDOR);
    comprador = makeUser('comprador-1', 'Comprador', Role.COMPRADOR);
    gerente = makeUser('gerente-1', 'Gerente', Role.GERENTE);

    userRepository.seed(vendedor);
    userRepository.seed(outroVendedor);
    userRepository.seed(comprador);
    userRepository.seed(gerente);
  });

  it('registra uma falta com status inicial REGISTRADA', async () => {
    const result = await useCase.register({
      storeId,
      codigoPeca: 'FR-5548',
      nomePeca: 'Filtro de oleo',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(ShortageStatus.REGISTRADA);
  });

  it('normaliza codigo e nome da peca para maiusculas', async () => {
    const result = await useCase.register({
      storeId,
      codigoPeca: '  fr-5548  ',
      nomePeca: '  filtro de óleo fram ph5548  ',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.codigoPeca).toBe('FR-5548');
    expect(result.value.nomePeca).toBe('FILTRO DE ÓLEO FRAM PH5548');
  });

  it('trata codigo da peca em branco como nao informado', async () => {
    const result = await useCase.register({
      storeId,
      codigoPeca: '   ',
      nomePeca: 'Peca sem codigo',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.codigoPeca).toBeNull();
  });

  it('rejeita quantidade restante negativa', async () => {
    const result = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca X',
      qtdRestante: -1,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('falta marcada como emprestada cria um emprestimo PENDENTE junto', async () => {
    const result = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca emprestada',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
      emprestada: true,
      emprestadaDe: '  Loja Parceira  ',
    });

    expect(result.isOk).toBe(true);
    const emprestimos = await emprestimoRepository.listByStore(storeId);
    expect(emprestimos).toHaveLength(1);
    expect(emprestimos[0].shortageId).toBe(result.value.id);
    expect(emprestimos[0].status).toBe(EmprestimoStatus.PENDENTE);
    expect(emprestimos[0].emprestadaDe).toBe('Loja Parceira');
  });

  it('falta sem a marcacao de emprestada nao cria emprestimo', async () => {
    await registrarFalta('Peca comum');
    expect(await emprestimoRepository.listByStore(storeId)).toHaveLength(0);
  });

  it('comprador consegue mover REGISTRADA -> CONCLUIDA -> RECEBIDA', async () => {
    const registrada = await registrarFalta('Peca Y');

    const concluida = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });
    expect(concluida.isOk).toBe(true);

    const recebida = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
    });
    expect(recebida.isOk).toBe(true);
    expect(recebida.value.status).toBe(ShortageStatus.RECEBIDA);
  });

  it('gerente tambem pode conduzir a fila completa', async () => {
    const registrada = await registrarFalta('Peca do gerente');

    const concluida = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: gerente.id,
    });

    expect(concluida.isOk).toBe(true);
  });

  it('comprador pode informar a distribuidora vencedora ao concluir', async () => {
    const registrada = await registrarFalta('Peca com fornecedor');

    const concluida = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
      distribuidoraId: ligpecas.id,
    });

    expect(concluida.isOk).toBe(true);
    expect(concluida.value.distribuidoraId).toBe(ligpecas.id);
  });

  it('rejeita distribuidoraId informado fora da transicao para CONCLUIDA', async () => {
    const registrada = await registrarFalta('Peca com fornecedor invalido');
    await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
      distribuidoraId: ligpecas.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('rejeita distribuidora inativa ao concluir', async () => {
    const registrada = await registrarFalta('Peca com fornecedor inativo');

    const result = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
      distribuidoraId: distribuidoraInativa.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('permite concluir sem escolher distribuidora (opcional)', async () => {
    const registrada = await registrarFalta('Peca sem fornecedor ainda');

    const concluida = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    expect(concluida.isOk).toBe(true);
    expect(concluida.value.distribuidoraId).toBeNull();
  });

  it('transitionMany conclui varias faltas com a mesma distribuidora', async () => {
    const a = await registrarFalta('Peca lote A');
    const b = await registrarFalta('Peca lote B');
    const c = await registrarFalta('Peca lote C');

    const result = await useCase.transitionMany({
      shortageIds: [a.id, b.id, c.id],
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
      distribuidoraId: ligpecas.id,
    });

    expect(result.isOk).toBe(true);
    expect(result.value).toHaveLength(3);
    for (const shortage of result.value) {
      expect(shortage.status).toBe(ShortageStatus.CONCLUIDA);
      expect(shortage.distribuidoraId).toBe(ligpecas.id);
    }
  });

  it('transitionMany marca varias faltas CONCLUIDA como RECEBIDA', async () => {
    const a = await registrarFalta('Peca recebida A');
    const b = await registrarFalta('Peca recebida B');
    await useCase.transitionMany({
      shortageIds: [a.id, b.id],
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transitionMany({
      shortageIds: [a.id, b.id],
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
    });

    expect(result.isOk).toBe(true);
    expect(result.value).toHaveLength(2);
    for (const shortage of result.value) {
      expect(shortage.status).toBe(ShortageStatus.RECEBIDA);
    }
  });

  it('transitionMany nao altera nada se uma das faltas for invalida', async () => {
    const a = await registrarFalta('Peca lote valida');
    const b = await registrarFalta('Peca lote ja concluida');
    await useCase.transition({
      shortageId: b.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transitionMany({
      shortageIds: [a.id, b.id],
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidTransitionFailure);
    const aAtual = await shortageRepository.findById(a.id);
    expect(aAtual!.status).toBe(ShortageStatus.REGISTRADA);
  });

  it('transitionMany rejeita executor sem permissao', async () => {
    const a = await registrarFalta('Peca lote vendedor');

    const result = await useCase.transitionMany({
      shortageIds: [a.id],
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: vendedor.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(UnauthorizedFailure);
  });

  it('setDistribuidora permite preencher/corrigir a distribuidora depois', async () => {
    const registrada = await registrarFalta('Peca para corrigir fornecedor');
    await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    const corrigida = await useCase.setDistribuidora({
      shortageId: registrada.id,
      distribuidoraId: ligpecas.id,
      executadoPorId: comprador.id,
    });

    expect(corrigida.isOk).toBe(true);
    expect(corrigida.value.distribuidoraId).toBe(ligpecas.id);
  });

  it('setDistribuidora rejeita distribuidora de outra loja/inexistente', async () => {
    const registrada = await registrarFalta('Peca com fornecedor fantasma');

    const result = await useCase.setDistribuidora({
      shortageId: registrada.id,
      distribuidoraId: 'distribuidora-inexistente',
      executadoPorId: comprador.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundFailure);
  });

  it('vendedor nao pode executar transicoes operacionais', async () => {
    const registrada = await registrarFalta('Peca Z');

    const result = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: vendedor.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(UnauthorizedFailure);
  });

  it('rejeita transicao invalida (RECEBIDA nao pode voltar para CONCLUIDA)', async () => {
    const registrada = await registrarFalta('Peca W');
    await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });
    await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transition({
      shortageId: registrada.id,
      novoStatus: ShortageStatus.CONCLUIDA,
      executadoPorId: comprador.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidTransitionFailure);
  });

  it('vendedor pode cancelar a propria falta enquanto REGISTRADA', async () => {
    const registrada = await registrarFalta('Peca Cancelavel');

    const result = await useCase.cancel({
      shortageId: registrada.id,
      executadoPorId: vendedor.id,
      motivo: 'Registrei por engano',
    });

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(ShortageStatus.CANCELADA);
  });

  it('vendedor nao pode cancelar falta registrada por outro vendedor', async () => {
    const registrada = await registrarFalta('Peca de outro');

    const result = await useCase.cancel({
      shortageId: registrada.id,
      executadoPorId: outroVendedor.id,
      motivo: 'Tentando cancelar a do colega',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(UnauthorizedFailure);
  });

  it('cancelamento exige motivo', async () => {
    const registrada = await registrarFalta('Peca sem motivo');

    const result = await useCase.cancel({
      shortageId: registrada.id,
      executadoPorId: comprador.id,
      motivo: '   ',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });
});

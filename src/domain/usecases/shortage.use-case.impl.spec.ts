import { ShortageUseCaseImpl } from './shortage.use-case.impl';
import { FakeDistribuidoraRepository, FakeShortageRepository, FakeUserRepository } from './__fakes__';
import { Distribuidora, Role, ShortageOrigin, ShortageStatus, User } from '../entities';
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
  let useCase: ShortageUseCaseImpl;

  let vendedor: User;
  let outroVendedor: User;
  let comprador: User;
  let ligpecas: Distribuidora;
  let distribuidoraInativa: Distribuidora;

  beforeEach(() => {
    shortageRepository = new FakeShortageRepository();
    userRepository = new FakeUserRepository();
    distribuidoraRepository = new FakeDistribuidoraRepository();
    useCase = new ShortageUseCaseImpl(shortageRepository, userRepository, distribuidoraRepository);

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

    vendedor = new User({
      id: 'vendedor-1',
      storeId,
      nome: 'Vendedor A',
      email: null,
      senhaHash: null,
      usuario: 'vendedor.a',
      pinHash: 'hash',
      telefoneWhatsapp: null,
      papel: Role.VENDEDOR,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    outroVendedor = new User({
      id: 'vendedor-2',
      storeId,
      nome: 'Vendedor B',
      email: null,
      senhaHash: null,
      usuario: 'vendedor.b',
      pinHash: 'hash',
      telefoneWhatsapp: null,
      papel: Role.VENDEDOR,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    comprador = new User({
      id: 'comprador-1',
      storeId,
      nome: 'Comprador',
      email: 'comprador@loja.com',
      senhaHash: 'hash',
      usuario: null,
      pinHash: null,
      telefoneWhatsapp: null,
      papel: Role.COMPRADOR,
      ativo: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });

    userRepository.seed(vendedor);
    userRepository.seed(outroVendedor);
    userRepository.seed(comprador);
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

  it('comprador consegue mover REGISTRADA -> EM_COTACAO -> COMPRADA -> RECEBIDA', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca Y',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const emCotacao = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });
    expect(emCotacao.isOk).toBe(true);

    const comprada = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
    });
    expect(comprada.isOk).toBe(true);

    const recebida = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
    });
    expect(recebida.isOk).toBe(true);
    expect(recebida.value.status).toBe(ShortageStatus.RECEBIDA);
  });

  it('comprador pode informar a distribuidora vencedora ao marcar como comprada', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca com fornecedor',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });

    const comprada = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
      distribuidoraId: ligpecas.id,
    });

    expect(comprada.isOk).toBe(true);
    expect(comprada.value.distribuidoraId).toBe(ligpecas.id);
  });

  it('rejeita distribuidoraId informado fora da transicao para COMPRADA', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca com fornecedor invalido',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
      distribuidoraId: ligpecas.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('rejeita distribuidora inativa ao marcar como comprada', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca com fornecedor inativo',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
      distribuidoraId: distribuidoraInativa.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });

  it('permite marcar como comprada sem escolher distribuidora (opcional)', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca sem fornecedor ainda',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });

    const comprada = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
    });

    expect(comprada.isOk).toBe(true);
    expect(comprada.value.distribuidoraId).toBeNull();
  });

  it('setDistribuidora permite preencher/corrigir a distribuidora depois', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca para corrigir fornecedor',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
    });

    const corrigida = await useCase.setDistribuidora({
      shortageId: registrada.value.id,
      distribuidoraId: ligpecas.id,
      executadoPorId: comprador.id,
    });

    expect(corrigida.isOk).toBe(true);
    expect(corrigida.value.distribuidoraId).toBe(ligpecas.id);
  });

  it('setDistribuidora rejeita distribuidora de outra loja/inexistente', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca com fornecedor fantasma',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.setDistribuidora({
      shortageId: registrada.value.id,
      distribuidoraId: 'distribuidora-inexistente',
      executadoPorId: comprador.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundFailure);
  });

  it('vendedor nao pode executar transicoes operacionais', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca Z',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: vendedor.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(UnauthorizedFailure);
  });

  it('rejeita transicao invalida (RECEBIDA nao pode voltar para EM_COTACAO)', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca W',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.COMPRADA,
      executadoPorId: comprador.id,
    });
    await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.RECEBIDA,
      executadoPorId: comprador.id,
    });

    const result = await useCase.transition({
      shortageId: registrada.value.id,
      novoStatus: ShortageStatus.EM_COTACAO,
      executadoPorId: comprador.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidTransitionFailure);
  });

  it('vendedor pode cancelar a propria falta enquanto REGISTRADA', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca Cancelavel',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.cancel({
      shortageId: registrada.value.id,
      executadoPorId: vendedor.id,
      motivo: 'Registrei por engano',
    });

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(ShortageStatus.CANCELADA);
  });

  it('vendedor nao pode cancelar falta registrada por outro vendedor', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca de outro',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.cancel({
      shortageId: registrada.value.id,
      executadoPorId: outroVendedor.id,
      motivo: 'Tentando cancelar a do colega',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(UnauthorizedFailure);
  });

  it('cancelamento exige motivo', async () => {
    const registrada = await useCase.register({
      storeId,
      codigoPeca: null,
      nomePeca: 'Peca sem motivo',
      qtdRestante: 0,
      observacao: null,
      registradoPorId: vendedor.id,
      origem: ShortageOrigin.WEB,
    });

    const result = await useCase.cancel({
      shortageId: registrada.value.id,
      executadoPorId: comprador.id,
      motivo: '   ',
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationFailure);
  });
});

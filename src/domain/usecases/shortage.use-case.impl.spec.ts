import { ShortageUseCaseImpl } from './shortage.use-case.impl';
import { FakeShortageRepository, FakeUserRepository } from './__fakes__';
import { Role, ShortageOrigin, ShortageStatus, User } from '../entities';
import { InvalidTransitionFailure, UnauthorizedFailure, ValidationFailure } from '../failures';

describe('ShortageUseCaseImpl', () => {
  const storeId = 'store-1';
  let shortageRepository: FakeShortageRepository;
  let userRepository: FakeUserRepository;
  let useCase: ShortageUseCaseImpl;

  let vendedor: User;
  let outroVendedor: User;
  let comprador: User;

  beforeEach(() => {
    shortageRepository = new FakeShortageRepository();
    userRepository = new FakeUserRepository();
    useCase = new ShortageUseCaseImpl(shortageRepository, userRepository);

    vendedor = new User({
      id: 'vendedor-1',
      storeId,
      nome: 'Vendedor A',
      email: 'vendedorA@loja.com',
      senhaHash: 'hash',
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
      email: 'vendedorB@loja.com',
      senhaHash: 'hash',
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

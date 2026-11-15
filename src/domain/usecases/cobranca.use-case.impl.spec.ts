import { CobrancaAtencao, CobrancaStatus, Store } from '../entities';
import { CobrancaUseCaseImpl } from './cobranca.use-case.impl';
import { FakeCobrancaRepository, FakeStoreRepository } from './__fakes__';

const storeId = 'loja-piloto';

function rawClient(code = '10', name = 'Oficina Silva') {
  return {
    code,
    name,
    phones: [],
    address: ['RUA A'],
    bairro: 'CENTRO',
    city: 'MACEIO',
    uf: 'AL',
    cep: '57000-000',
    numero: '10',
    docs: [
      {
        desc: 'Saída 1 - 1/1',
        seller: '9 - BRUNO',
        tipo: 'A',
        emissao: '01/01/2025',
        venc: '01/01/2025',
        valor: 150,
        saida: '1',
        parcela: '1/1',
      },
    ],
    total: 150,
  };
}

describe('CobrancaUseCaseImpl', () => {
  let repository: FakeCobrancaRepository;
  let stores: FakeStoreRepository;
  let useCase: CobrancaUseCaseImpl;

  beforeEach(() => {
    repository = new FakeCobrancaRepository();
    stores = new FakeStoreRepository();
    stores.seed(
      new Store({
        id: storeId,
        codigo: 'porto',
        senhaHash: 'x',
        nome: 'Porto de Lira Autopeças',
        segmento: 'AUTOPECAS',
        whatsappNumero: null,
        ativa: true,
        criadaEm: new Date(),
        atualizadaEm: new Date(),
      }),
    );
    useCase = new CobrancaUseCaseImpl(repository, stores);
  });

  it('importa o relatorio, guarda fone e reabre pago que ainda esta vencido', async () => {
    const primeiro = await useCase.importar({
      storeId,
      importadoPorId: 'admin-1',
      referencia: '15/11/2026',
      clientes: [rawClient()],
    });
    expect(primeiro.isOk).toBe(true);
    expect(primeiro.value.clientes[0].carteiraVencida).toBe(150);
    expect(primeiro.value.lojaNome).toBe('Porto de Lira Autopeças');

    await useCase.atualizarCliente({
      storeId,
      codigo: '10',
      telefone: '82988887777',
      status: CobrancaStatus.PAGO_PIX,
    });

    const segundo = await useCase.importar({
      storeId,
      importadoPorId: 'admin-1',
      referencia: '16/11/2026',
      clientes: [rawClient()],
    });
    expect(segundo.isOk).toBe(true);
    expect(segundo.value.reabertos).toEqual(['Oficina Silva']);
    expect(segundo.value.clientes[0].status).toBe(CobrancaStatus.A_COBRAR);
    expect(segundo.value.clientes[0].telefone).toBe('82988887777');
  });

  it('rejeita PDF vazio e aceita regra de conta interna', async () => {
    const vazio = await useCase.importar({
      storeId,
      importadoPorId: 'admin-1',
      referencia: '15/11/2026',
      clientes: [],
    });
    expect(vazio.isErr).toBe(true);

    const regra = await useCase.criarRegra({
      storeId,
      tipo: CobrancaAtencao.INTERNO,
      codigoCliente: '638',
    });
    expect(regra.isOk).toBe(true);

    const painel = await useCase.importar({
      storeId,
      importadoPorId: 'admin-1',
      referencia: '15/11/2026',
      clientes: [rawClient('638', 'JHP DE LIRA')],
    });
    expect(painel.isOk).toBe(true);
    expect(painel.value.clientes[0].attention).toBe(CobrancaAtencao.INTERNO);
  });
});

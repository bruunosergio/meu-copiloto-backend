import { CobrancaAtencao, CobrancaRawClient, CobrancaStatus } from '../entities';
import { attentionOf, buildClients, namesToReopen } from './ledger';

function client(partial: Partial<CobrancaRawClient> & Pick<CobrancaRawClient, 'code' | 'name'>): CobrancaRawClient {
  return {
    phones: [],
    address: [],
    bairro: '',
    city: 'MACEIO',
    uf: 'AL',
    cep: '',
    numero: '',
    docs: [
      {
        desc: 'Saída 10 - 1/1',
        seller: '9 - BRUNO',
        tipo: 'A',
        emissao: '01/01/2025',
        venc: '01/01/2025',
        valor: 100,
        saida: '10',
        parcela: '1/1',
      },
    ],
    total: 100,
    ...partial,
  };
}

describe('cobranca ledger', () => {
  it('marca prefeitura e balcao pelas regras e pelo nome', () => {
    const regras = [
      { tipo: CobrancaAtencao.INTERNO, codigoCliente: '638', nomeContem: null },
      { tipo: CobrancaAtencao.BALCAO, codigoCliente: '1', nomeContem: null },
    ];
    expect(attentionOf('638', 'JHP DE LIRA', regras)).toBe(CobrancaAtencao.INTERNO);
    expect(attentionOf('1', 'CLIENTE BALCAO', regras)).toBe(CobrancaAtencao.BALCAO);
    expect(attentionOf('99', 'PREFEITURA MUNICIPAL', [])).toBe(CobrancaAtencao.PREFEITURA);
    expect(attentionOf('50', 'CLIENTE QUALQUER', [])).toBeNull();
  });

  it('separa cartao da carteira vencida e deriva o vendedor do PDF', () => {
    const clients = buildClients(
      [
        client({
          code: '10',
          name: 'Oficina Silva',
          docs: [
            {
              desc: 'Fiado',
              seller: '9 - BRUNO',
              tipo: 'A',
              emissao: '01/01/2024',
              venc: '01/01/2024',
              valor: 200,
              saida: '1',
              parcela: '1/1',
            },
            {
              desc: 'Maquina',
              seller: '9 - BRUNO',
              tipo: 'C',
              emissao: '01/01/2024',
              venc: '01/01/2024',
              valor: 80,
              saida: '2',
              parcela: '1/1',
            },
          ],
          total: 280,
        }),
      ],
      '15/11/2026',
      [],
      [],
    );
    expect(clients[0].carteiraVencida).toBe(200);
    expect(clients[0].cartao).toBe(80);
    expect(clients[0].primarySellerName).toBe('BRUNO');
    expect(clients[0].oldestDays).toBeGreaterThan(300);
  });

  it('reabre quem estava pago e ainda tem carteira vencida', () => {
    const clients = buildClients(
      [client({ code: '10', name: 'Oficina Silva' })],
      '15/11/2026',
      [],
      [
        {
          id: '1',
          storeId: 'loja',
          codigo: '10',
          telefoneOverride: '82999998888',
          status: CobrancaStatus.PAGO_PIX,
          promessa: null,
          anotacao: null,
          atualizadoEm: new Date(),
        },
      ],
    );
    expect(namesToReopen(clients)).toEqual(['Oficina Silva']);
    expect(clients[0].telefone).toBe('82999998888');
  });
});

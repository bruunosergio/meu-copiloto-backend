import {
  CobrancaAtencao,
  CobrancaAcompanhamento,
  CobrancaClientView,
  CobrancaDocView,
  CobrancaPainel,
  CobrancaRawClient,
  CobrancaRegra,
  CobrancaRelatorio,
  CobrancaSellerSlice,
  CobrancaStatus,
  CobrancaStats,
  isPaidCobrancaStatus,
} from '../entities';

type RefDate = { y: number; m: number; d: number };

const AGING_ORDER = [
  'vence hoje',
  '1 a 7 dias',
  '8 a 30 dias',
  '31 a 60 dias',
  '61 a 90 dias',
  '91 a 180 dias',
  'mais de 180 dias',
  'a vencer',
];

export function referenciaLabel(referencia: string): string {
  const ref = parseRef(referencia);
  const day = String(ref.d).padStart(2, '0');
  const month = String(ref.m).padStart(2, '0');
  return `${day}/${month}/${ref.y}`;
}

export function parseRef(referencia: string): RefDate {
  const br = referencia.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return { d: Number(br[1]), m: Number(br[2]), y: Number(br[3]) };
  const iso = referencia.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) };
  throw new Error('Data de referencia invalida.');
}

export function digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function hasReportPhone(phones: string[]): boolean {
  return phones.some((phone) => digits(phone).length >= 8);
}

export function effectivePhone(phones: string[], override: string | null | undefined): string {
  if (override !== undefined && override !== null) return override;
  return phones.join(' / ');
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function daysLate(venc: string, ref: RefDate): number {
  const [d, m, y] = venc.split('/').map(Number);
  if (!d || !m || !y) return 0;
  const due = Date.UTC(y, m - 1, d);
  const base = Date.UTC(ref.y, ref.m - 1, ref.d);
  return Math.round((base - due) / 86_400_000);
}

function slugSeller(rawSeller: string): { id: string; name: string } {
  const raw = rawSeller.trim();
  if (!raw) return { id: 'sem', name: 'Sem vendedor' };
  const dash = raw.indexOf(' - ');
  const name = dash >= 0 ? raw.slice(dash + 3).trim() || raw : raw;
  const id = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return { id: id || 'outro', name };
}

export function attentionOf(
  code: string,
  name: string,
  regras: Pick<CobrancaRegra, 'tipo' | 'codigoCliente' | 'nomeContem'>[],
): CobrancaAtencao | null {
  const upper = name.toUpperCase();
  for (const regra of regras) {
    if (regra.codigoCliente && regra.codigoCliente === code) return regra.tipo;
    if (regra.nomeContem && upper.includes(regra.nomeContem.trim().toUpperCase())) return regra.tipo;
  }
  if (upper.includes('PREFEITURA')) return CobrancaAtencao.PREFEITURA;
  if (upper.includes('CLIENTE BALC')) return CobrancaAtencao.BALCAO;
  return null;
}

function addressLine(client: CobrancaRawClient): string {
  const street = client.address.filter(Boolean).join(' ');
  const parts: string[] = [];
  if (street) parts.push(client.numero ? `${street}, ${client.numero}` : street);
  if (client.bairro) parts.push(client.bairro);
  if (client.city) parts.push(client.uf ? `${client.city}/${client.uf}` : client.city);
  if (client.cep) parts.push(client.cep);
  return parts.join(' · ');
}

function enrich(
  client: CobrancaRawClient,
  ref: RefDate,
  regras: Pick<CobrancaRegra, 'tipo' | 'codigoCliente' | 'nomeContem'>[],
  acompanhamento: CobrancaAcompanhamento | undefined,
): CobrancaClientView {
  const docs: CobrancaDocView[] = client.docs.map((doc) => {
    const seller = slugSeller(doc.seller);
    return {
      desc: doc.desc,
      seller: doc.seller,
      sellerId: seller.id,
      sellerName: seller.name,
      tipo: doc.tipo,
      tipoLabel: doc.tipo === 'C' ? 'Cartão' : 'Carteira',
      emissao: doc.emissao,
      venc: doc.venc,
      valor: doc.valor,
      saida: doc.saida,
      parcela: doc.parcela,
      days: doc.venc ? daysLate(doc.venc, ref) : 0,
    };
  });

  let carteiraVencida = 0;
  let carteiraHoje = 0;
  let carteiraFutura = 0;
  let cartao = 0;
  let notasVencidas = 0;
  let oldest: { venc: string; days: number } | null = null;
  const sellerBuckets = new Map<string, CobrancaSellerSlice>();

  for (const doc of docs) {
    if (doc.tipo === 'C') {
      cartao += doc.valor;
      continue;
    }
    if (doc.days > 0) {
      carteiraVencida += doc.valor;
      notasVencidas += 1;
      if (!oldest || doc.days > oldest.days) oldest = { venc: doc.venc, days: doc.days };
    } else if (doc.days === 0) {
      carteiraHoje += doc.valor;
    } else {
      carteiraFutura += doc.valor;
    }
    const current = sellerBuckets.get(doc.sellerId) ?? {
      id: doc.sellerId,
      name: doc.sellerName,
      vencido: 0,
      total: 0,
    };
    current.total += doc.valor;
    if (doc.days > 0) current.vencido += doc.valor;
    sellerBuckets.set(doc.sellerId, current);
  }

  const sellers = [...sellerBuckets.values()]
    .map((seller) => ({
      ...seller,
      vencido: round2(seller.vencido),
      total: round2(seller.total),
    }))
    .sort((a, b) => b.vencido - a.vencido || b.total - a.total);

  const primary = sellers[0];
  const override = acompanhamento?.telefoneOverride ?? null;

  return {
    code: client.code,
    name: client.name,
    phones: client.phones,
    telefone: effectivePhone(client.phones, override),
    telefoneOverride: override,
    addressLine: addressLine(client),
    city: client.city || 'Sem cidade',
    docs: docs.sort((a, b) => b.days - a.days),
    total: round2(client.total),
    carteiraVencida: round2(carteiraVencida),
    carteiraHoje: round2(carteiraHoje),
    carteiraFutura: round2(carteiraFutura),
    cartao: round2(cartao),
    notasVencidas,
    oldestVenc: oldest?.venc ?? null,
    oldestDays: oldest?.days ?? null,
    sellers,
    primarySellerId: primary?.id ?? 'sem',
    primarySellerName: primary?.name ?? 'Sem vendedor',
    attention: attentionOf(client.code, client.name, regras),
    status: acompanhamento?.status ?? CobrancaStatus.A_COBRAR,
    promessa: acompanhamento?.promessa ?? null,
    anotacao: acompanhamento?.anotacao ?? null,
  };
}

function sum(values: number[]): number {
  return round2(values.reduce((total, value) => total + value, 0));
}

function bucket(days: number): string {
  if (days < 0) return 'a vencer';
  if (days === 0) return 'vence hoje';
  if (days <= 7) return '1 a 7 dias';
  if (days <= 30) return '8 a 30 dias';
  if (days <= 60) return '31 a 60 dias';
  if (days <= 90) return '61 a 90 dias';
  if (days <= 180) return '91 a 180 dias';
  return 'mais de 180 dias';
}

export function buildStats(clients: CobrancaClientView[]): CobrancaStats {
  const carteiraDocs = clients.flatMap((client) => client.docs.filter((doc) => doc.tipo !== 'C'));
  const sellerMap = new Map<string, { id: string; name: string; vencido: number }>();
  for (const client of clients) {
    for (const seller of client.sellers) {
      const current = sellerMap.get(seller.id) ?? { id: seller.id, name: seller.name, vencido: 0 };
      current.vencido = round2(current.vencido + seller.vencido);
      sellerMap.set(seller.id, current);
    }
  }

  return {
    clientes: clients.length,
    notas: clients.reduce((total, client) => total + client.docs.length, 0),
    total: sum(clients.map((client) => client.total)),
    carteiraVencida: sum(clients.map((client) => client.carteiraVencida)),
    carteiraHoje: sum(clients.map((client) => client.carteiraHoje)),
    carteiraFutura: sum(clients.map((client) => client.carteiraFutura)),
    cartao: sum(clients.map((client) => client.cartao)),
    semTelefone: clients.filter((client) => !hasReportPhone(client.phones)).length,
    aging: AGING_ORDER.map((label) => ({
      label,
      valor: sum(carteiraDocs.filter((doc) => bucket(doc.days) === label).map((doc) => doc.valor)),
      notas: carteiraDocs.filter((doc) => bucket(doc.days) === label).length,
    })),
    sellers: [...sellerMap.values()].sort((a, b) => b.vencido - a.vencido || a.name.localeCompare(b.name, 'pt-BR')),
  };
}

export function buildClients(
  rawClients: CobrancaRawClient[],
  referencia: string,
  regras: Pick<CobrancaRegra, 'tipo' | 'codigoCliente' | 'nomeContem'>[],
  acompanhamentos: CobrancaAcompanhamento[],
): CobrancaClientView[] {
  const ref = parseRef(referencia);
  const byCode = new Map(acompanhamentos.map((item) => [item.codigo, item]));
  return rawClients
    .map((client) => enrich(client, ref, regras, byCode.get(client.code)))
    .sort(
      (a, b) =>
        b.carteiraVencida - a.carteiraVencida || b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'),
    );
}

export function namesToReopen(clients: CobrancaClientView[]): string[] {
  const names: string[] = [];
  for (const client of clients) {
    if (isPaidCobrancaStatus(client.status) && client.carteiraVencida > 0) {
      names.push(client.name);
    }
  }
  return names;
}

export function emptyStats(): CobrancaStats {
  return {
    clientes: 0,
    notas: 0,
    total: 0,
    carteiraVencida: 0,
    carteiraHoje: 0,
    carteiraFutura: 0,
    cartao: 0,
    semTelefone: 0,
    aging: AGING_ORDER.map((label) => ({ label, valor: 0, notas: 0 })),
    sellers: [],
  };
}

export function assemblePainel(input: {
  lojaNome: string;
  dddPadrao: string;
  relatorio: CobrancaRelatorio | null;
  regras: CobrancaRegra[];
  acompanhamentos: CobrancaAcompanhamento[];
  reabertos?: string[];
}): CobrancaPainel {
  if (!input.relatorio) {
    return {
      lojaNome: input.lojaNome,
      dddPadrao: input.dddPadrao,
      relatorio: null,
      reabertos: [],
      clientes: [],
      stats: emptyStats(),
      regras: input.regras,
    };
  }
  const clientes = buildClients(
    input.relatorio.clientes,
    input.relatorio.referencia,
    input.regras,
    input.acompanhamentos,
  );
  return {
    lojaNome: input.lojaNome,
    dddPadrao: input.dddPadrao,
    relatorio: {
      referencia: input.relatorio.referencia,
      referenciaLabel: referenciaLabel(input.relatorio.referencia),
      fonte: input.relatorio.fonte,
      importadoEm: input.relatorio.importadoEm,
    },
    reabertos: input.reabertos ?? [],
    clientes,
    stats: buildStats(clientes),
    regras: input.regras,
  };
}

export const DEFAULT_COBRANCA_REGRAS: Pick<CobrancaRegra, 'tipo' | 'codigoCliente' | 'nomeContem'>[] = [
  { tipo: CobrancaAtencao.BALCAO, codigoCliente: '1', nomeContem: null },
  { tipo: CobrancaAtencao.PREFEITURA, codigoCliente: null, nomeContem: 'PREFEITURA' },
  { tipo: CobrancaAtencao.BALCAO, codigoCliente: null, nomeContem: 'CLIENTE BALC' },
];

import { CobrancaRawClient, CobrancaRawDoc } from '../entities';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseDoc(value: unknown): CobrancaRawDoc | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const valor = asNumber(raw.valor);
  if (valor === null) return null;
  return {
    desc: asString(raw.desc),
    seller: asString(raw.seller),
    tipo: asString(raw.tipo),
    emissao: asString(raw.emissao),
    venc: asString(raw.venc),
    valor,
    saida: asString(raw.saida),
    parcela: asString(raw.parcela),
  };
}

export function parseRawClients(value: unknown): CobrancaRawClient[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const clients: CobrancaRawClient[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const raw = item as Record<string, unknown>;
    const code = asString(raw.code).trim();
    const name = asString(raw.name).trim();
    const total = asNumber(raw.total);
    if (!code || !name || total === null || !Array.isArray(raw.docs)) return null;
    const docs: CobrancaRawDoc[] = [];
    for (const doc of raw.docs) {
      const parsed = parseDoc(doc);
      if (!parsed) return null;
      docs.push(parsed);
    }
    clients.push({
      code,
      name,
      phones: asStringArray(raw.phones),
      address: asStringArray(raw.address),
      bairro: asString(raw.bairro),
      city: asString(raw.city),
      uf: asString(raw.uf),
      cep: asString(raw.cep),
      numero: asString(raw.numero),
      docs,
      total,
    });
  }
  return clients;
}

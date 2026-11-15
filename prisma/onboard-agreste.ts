import { randomInt } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Cria a loja Agreste Auto Pecas + 5 usuarios. Idempotente: se o codigo
 * "agreste" ou o usuario ja existir, nao troca senha/PIN.
 *
 * Uso: npm run onboard:agreste
 * Credenciais novas vao para stdout e para prisma/onboard-creds/agreste.txt
 * (arquivo ignorado pelo git).
 */
const prisma = new PrismaClient();

const STORE_CODIGO = 'agreste';
const STORE_NOME = 'Agreste Auto Peças';

const USERS: { nome: string; usuario: string; papel: Role }[] = [
  { nome: 'Thiago', usuario: 'thiago', papel: Role.ADMIN },
  { nome: 'Henrique', usuario: 'henrique', papel: Role.GERENTE },
  { nome: 'Gabriel', usuario: 'gabriel', papel: Role.VENDEDOR },
  { nome: 'Indio', usuario: 'indio', papel: Role.VENDEDOR },
  { nome: 'Matheus', usuario: 'matheus', papel: Role.VENDEDOR },
];

const DISTRIBUIDORAS = [
  'LIGPECAS',
  'DPK',
  'KKI Autonorte',
  'Real Moto Pecas',
  'Pellegrino',
  'Roles',
  'Sama',
  'Isapa',
];

const PIN_FRACO = new Set(['0000', '1111', '1234', '123456', '0123', '9999', '2580']);

function pin4(): string {
  for (let i = 0; i < 40; i += 1) {
    const pin = String(randomInt(0, 10_000)).padStart(4, '0');
    if (!PIN_FRACO.has(pin) && new Set(pin).size >= 3) return pin;
  }
  throw new Error('Nao consegui gerar um PIN.');
}

function senhaLoja(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letras = Array.from({ length: 3 }, () => alfabeto[randomInt(0, alfabeto.length)]).join('');
  const numeros = String(randomInt(0, 10_000)).padStart(4, '0');
  return `${letras}-${numeros}`;
}

async function main() {
  const linhas: string[] = [];
  const log = (line: string) => {
    linhas.push(line);
    console.log(line);
  };

  log('Meu Copiloto — Agreste Auto Peças');
  log('=================================');
  log('');

  let store = await prisma.store.findUnique({ where: { codigo: STORE_CODIGO } });
  let senhaTerminal: string | null = null;

  if (!store) {
    senhaTerminal = senhaLoja();
    store = await prisma.store.create({
      data: {
        codigo: STORE_CODIGO,
        senhaHash: await bcrypt.hash(senhaTerminal, 10),
        nome: STORE_NOME,
        segmento: 'AUTOPECAS',
      },
    });
    log(`Loja criada: ${store.nome}`);
    log(`Código do computador: ${STORE_CODIGO}`);
    log(`Senha do computador:  ${senhaTerminal}`);
  } else {
    log(`Loja já existia: ${store.nome} (código ${store.codigo}). Senha do terminal não foi alterada.`);
  }

  log('');
  log('Pessoas (nome na grade → PIN):');

  const pessoas: { nome: string; papel: string; usuario: string; pin: string | null }[] = [];

  for (const pessoa of USERS) {
    const existente = await prisma.user.findUnique({
      where: { storeId_usuario: { storeId: store.id, usuario: pessoa.usuario } },
    });
    if (existente) {
      pessoas.push({ nome: pessoa.nome, papel: pessoa.papel, usuario: pessoa.usuario, pin: null });
      log(`  ${pessoa.nome} (${pessoa.papel}) — já cadastrado, PIN não alterado`);
      continue;
    }
    const pin = pin4();
    await prisma.user.create({
      data: {
        storeId: store.id,
        nome: pessoa.nome,
        usuario: pessoa.usuario,
        pinHash: await bcrypt.hash(pin, 10),
        papel: pessoa.papel,
      },
    });
    pessoas.push({ nome: pessoa.nome, papel: pessoa.papel, usuario: pessoa.usuario, pin });
    log(`  ${pessoa.nome}  PIN ${pin}  (${pessoa.papel})`);
  }

  log('');
  for (const nome of DISTRIBUIDORAS) {
    await prisma.distribuidora.upsert({
      where: { storeId_nome: { storeId: store.id, nome } },
      update: {},
      create: { storeId: store.id, nome },
    });
  }
  log(`Distribuidoras: ${DISTRIBUIDORAS.length} conferidas.`);
  log('');
  log('Entrada: https://meu-copiloto-web.vercel.app/loja');
  log('1) Código agreste + senha do computador');
  log('2) Tocar no nome');
  log('3) Digitar o PIN');
  log('');
  log('Thiago (Administrador) cadastra gente e distribuidoras.');
  log('Henrique (Gerente) conduz a fila de faltas, tarefas e cobranças.');
  log('Gabriel, Indio e Matheus (Vendedor) registram falta; veem só as próprias.');

  const dir = join(__dirname, 'onboard-creds');
  mkdirSync(dir, { recursive: true });
  const gerouSegredo = senhaTerminal !== null || pessoas.some((p) => p.pin);
  if (gerouSegredo) {
    writeFileSync(join(dir, 'agreste.txt'), `${linhas.join('\n')}\n`, 'utf8');
    log('');
    log('Cópia local (não vai pro git): prisma/onboard-creds/agreste.txt');
  }
}

main()
  .catch((error) => {
    console.error('Falha no onboarding da Agreste:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

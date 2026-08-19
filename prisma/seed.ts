import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const storeName = process.env.SEED_STORE_NAME ?? 'Loja Piloto';
  const storeCodigo = process.env.SEED_STORE_CODIGO ?? 'loja-piloto';
  const storeSenha = process.env.SEED_STORE_SENHA ?? 'TrocarSenhaLoja123!';
  const adminNome = process.env.SEED_ADMIN_NOME ?? 'Administrador';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lojapiloto.com';
  const adminSenha = process.env.SEED_ADMIN_SENHA ?? 'TrocarSenha123!';

  const storeSenhaHash = await bcrypt.hash(storeSenha, 10);

  // codigo/senhaHash sao atualizados a cada seed de proposito: sao dados de
  // configuracao administrativa (nao dados de uso da loja), entao reaplicar
  // o seed deve manter a senha do terminal sincronizada com SEED_STORE_SENHA.
  const store = await prisma.store.upsert({
    where: { id: 'loja-piloto' },
    update: { codigo: storeCodigo, senhaHash: storeSenhaHash },
    create: {
      id: 'loja-piloto',
      codigo: storeCodigo,
      senhaHash: storeSenhaHash,
      nome: storeName,
      segmento: 'AUTOPECAS',
    },
  });

  const senhaHash = await bcrypt.hash(adminSenha, 10);

  const admin = await prisma.user.upsert({
    where: { storeId_email: { storeId: store.id, email: adminEmail } },
    update: {},
    create: {
      storeId: store.id,
      nome: adminNome,
      email: adminEmail,
      senhaHash,
      papel: Role.ADMIN,
    },
  });

  const distribuidorasIniciais = [
    'LIGPECAS',
    'DPK',
    'KKI Autonorte',
    'Real Moto Pecas',
    'Pellegrino',
    'Roles',
    'Sama',
    'Isapa',
  ];

  for (const nome of distribuidorasIniciais) {
    await prisma.distribuidora.upsert({
      where: { storeId_nome: { storeId: store.id, nome } },
      update: {},
      create: { storeId: store.id, nome },
    });
  }

  console.log('Seed concluido:');
  console.log(`  Loja: ${store.nome} (${store.id})`);
  console.log(`  Terminal da loja: codigo "${store.codigo}" / senha definida em SEED_STORE_SENHA`);
  console.log(`  Admin: ${admin.email} / senha definida em SEED_ADMIN_SENHA`);
  console.log(`  Distribuidoras: ${distribuidorasIniciais.length} cadastradas/verificadas`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

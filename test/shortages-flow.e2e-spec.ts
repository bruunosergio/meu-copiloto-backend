import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/config/modules/app.module';
import { PrismaService } from '../src/infra/database/prisma.service';
import { Role } from '../src/domain/entities';

/**
 * Cobre o fluxo principal da Fase 1: login -> criacao de usuarios -> registro
 * de falta -> transicao de status pelo comprador.
 *
 * Roda contra a MESMA loja configurada em DEFAULT_STORE_ID (a loja piloto real),
 * porque o AuthController resolve a loja por essa variavel de ambiente e nao ha
 * como trocar isso em tempo de teste (o ConfigModule le o .env no momento em que
 * o AppModule e importado, antes de qualquer beforeAll rodar).
 *
 * Para nao colidir nem sujar os dados reais da loja piloto, os usuarios e a
 * falta criados aqui usam e-mails/identificadores exclusivos deste teste e sao
 * removidos individualmente no afterAll - nunca apagamos a loja nem o admin
 * criado pelo seed.
 *
 * Requer DATABASE_URL apontando para um Postgres com as migrations e o seed
 * aplicados (o mesmo do `docker compose up` + `npm run seed` do README serve).
 */
describe('Fluxo de faltas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const vendedorEmail = `vendedor.e2e.${sufixo}@teste.com`;
  const compradorEmail = `comprador.e2e.${sufixo}@teste.com`;
  const vendedorSenha = 'VendedorSenha123!';
  const compradorSenha = 'CompradorSenha123!';

  let vendedorId: string;
  let compradorId: string;
  let vendedorToken: string;
  let compradorToken: string;
  let shortageId: string;
  let outraFaltaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const storeId = process.env.DEFAULT_STORE_ID ?? 'loja-piloto';
    const admin = await prisma.user.findFirst({
      where: { storeId, papel: Role.ADMIN, ativo: true },
    });
    if (!admin) {
      throw new Error(
        'Nenhum admin ativo encontrado. Rode "npm run seed" antes de executar os testes e2e.',
      );
    }

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, senha: process.env.SEED_ADMIN_SENHA ?? 'TrocarSenha123!' });

    if (adminLogin.status !== 200) {
      throw new Error(
        'Nao foi possivel logar como o admin do seed. Confirme SEED_ADMIN_SENHA no .env ' +
          'e que "npm run seed" foi executado contra o banco atual.',
      );
    }

    const adminToken: string = adminLogin.body.token;

    const vendedorResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Vendedor E2E', email: vendedorEmail, senha: vendedorSenha, papel: Role.VENDEDOR })
      .expect(201);
    vendedorId = vendedorResponse.body.id;

    const compradorResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Comprador E2E', email: compradorEmail, senha: compradorSenha, papel: Role.COMPRADOR })
      .expect(201);
    compradorId = compradorResponse.body.id;
  });

  afterAll(async () => {
    await prisma.statusTransition.deleteMany({
      where: { shortage: { registradoPorId: { in: [vendedorId] } } },
    });
    await prisma.shortage.deleteMany({ where: { registradoPorId: vendedorId } });
    await prisma.user.deleteMany({ where: { id: { in: [vendedorId, compradorId] } } });
    await app.close();
  });

  it('vendedor e comprador conseguem logar', async () => {
    const vendedorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: vendedorEmail, senha: vendedorSenha })
      .expect(200);
    vendedorToken = vendedorLogin.body.token;

    const compradorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: compradorEmail, senha: compradorSenha })
      .expect(200);
    compradorToken = compradorLogin.body.token;
  });

  it('vendedor registra uma falta', async () => {
    const response = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({
        codigoPeca: 'FR-5548',
        nomePeca: 'Filtro de oleo Fram PH5548',
        qtdRestante: 0,
        observacao: 'Ultima unidade vendida',
      })
      .expect(201);

    expect(response.body.status).toBe('REGISTRADA');
    shortageId = response.body.id;
  });

  it('vendedor ve apenas as proprias faltas na fila', async () => {
    const response = await request(app.getHttpServer())
      .get('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .expect(200);

    const ids = response.body.map((shortage: { id: string }) => shortage.id);
    expect(ids).toContain(shortageId);
    expect(
      response.body.every((shortage: { registradoPorId: string }) => shortage.registradoPorId === vendedorId),
    ).toBe(true);
  });

  it('comprador conduz a falta por todo o ciclo de vida', async () => {
    await request(app.getHttpServer())
      .patch(`/shortages/${shortageId}/status`)
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ novoStatus: 'EM_COTACAO' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/shortages/${shortageId}/status`)
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ novoStatus: 'COMPRADA' })
      .expect(200);

    const recebida = await request(app.getHttpServer())
      .patch(`/shortages/${shortageId}/status`)
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ novoStatus: 'RECEBIDA' })
      .expect(200);

    expect(recebida.body.status).toBe('RECEBIDA');
  });

  it('transicao invalida e rejeitada', async () => {
    await request(app.getHttpServer())
      .patch(`/shortages/${shortageId}/status`)
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ novoStatus: 'EM_COTACAO' })
      .expect(400);
  });

  it('vendedor nao consegue transicionar status (apenas admin/comprador podem)', async () => {
    const outraFalta = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ nomePeca: 'Outra peca', qtdRestante: 1 })
      .expect(201);
    outraFaltaId = outraFalta.body.id;

    await request(app.getHttpServer())
      .patch(`/shortages/${outraFaltaId}/status`)
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ novoStatus: 'EM_COTACAO' })
      .expect(403);
  });
});

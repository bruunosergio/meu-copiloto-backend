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
 * O vendedor loga pelo fluxo do terminal da loja (codigo+senha -> escolhe o
 * nome -> PIN), nao por e-mail+senha - ver ADR-0007.
 *
 * Requer DATABASE_URL apontando para um Postgres com as migrations e o seed
 * aplicados (o mesmo do `docker compose up` + `npm run seed` do README serve).
 */
describe('Fluxo de faltas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const vendedorUsuario = `vendedor.e2e.${sufixo}`;
  const compradorEmail = `comprador.e2e.${sufixo}@teste.com`;
  const vendedorPin = '4321';
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
      .send({ nome: 'Vendedor E2E', usuario: vendedorUsuario, pin: vendedorPin, papel: Role.VENDEDOR })
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
    await prisma.emprestimo.deleteMany({
      where: { shortage: { registradoPorId: { in: [vendedorId] } } },
    });
    await prisma.statusTransition.deleteMany({
      where: { shortage: { registradoPorId: { in: [vendedorId] } } },
    });
    await prisma.shortage.deleteMany({ where: { registradoPorId: vendedorId } });
    await prisma.user.deleteMany({ where: { id: { in: [vendedorId, compradorId] } } });
    await app.close();
  });

  it('vendedor loga pelo terminal da loja (codigo+senha -> escolhe o nome -> PIN)', async () => {
    const storeCodigo = process.env.SEED_STORE_CODIGO ?? 'loja-piloto';
    const storeSenha = process.env.SEED_STORE_SENHA ?? 'TrocarSenhaLoja123!';

    const storeLogin = await request(app.getHttpServer())
      .post('/auth/loja/login')
      .send({ codigo: storeCodigo, senha: storeSenha })
      .expect(200);
    const storeToken: string = storeLogin.body.storeToken;

    const vendedores = await request(app.getHttpServer())
      .get('/auth/loja/vendedores')
      .set('Authorization', `Bearer ${storeToken}`)
      .expect(200);
    expect(vendedores.body.some((v: { id: string }) => v.id === vendedorId)).toBe(true);

    const vendedorLogin = await request(app.getHttpServer())
      .post('/auth/loja/vendedor-login')
      .set('Authorization', `Bearer ${storeToken}`)
      .send({ userId: vendedorId, pin: vendedorPin })
      .expect(200);
    vendedorToken = vendedorLogin.body.token;
  });

  it('comprador loga com e-mail+senha', async () => {
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

  it('fila expoe o nome de quem registrou a falta', async () => {
    const response = await request(app.getHttpServer())
      .get('/shortages')
      .set('Authorization', `Bearer ${compradorToken}`)
      .expect(200);

    const falta = response.body.find((s: { id: string }) => s.id === shortageId);
    expect(falta.registradoPorNome).toBe('Vendedor E2E');
  });

  it('comprador conduz a falta por todo o ciclo de vida (REGISTRADA -> CONCLUIDA -> RECEBIDA)', async () => {
    await request(app.getHttpServer())
      .patch(`/shortages/${shortageId}/status`)
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ novoStatus: 'CONCLUIDA' })
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
      .send({ novoStatus: 'CONCLUIDA' })
      .expect(400);
  });

  it('vendedor nao consegue transicionar status (apenas admin/comprador/gerente podem)', async () => {
    const outraFalta = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ nomePeca: 'Outra peca', qtdRestante: 1 })
      .expect(201);
    outraFaltaId = outraFalta.body.id;

    await request(app.getHttpServer())
      .patch(`/shortages/${outraFaltaId}/status`)
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ novoStatus: 'CONCLUIDA' })
      .expect(403);
  });

  it('comprador conclui varias faltas em lote', async () => {
    const faltaA = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ nomePeca: 'Peca lote A', qtdRestante: 0 })
      .expect(201);
    const faltaB = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ nomePeca: 'Peca lote B', qtdRestante: 0 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .patch('/shortages/status')
      .set('Authorization', `Bearer ${compradorToken}`)
      .send({ ids: [faltaA.body.id, faltaB.body.id], novoStatus: 'CONCLUIDA' })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.every((s: { status: string }) => s.status === 'CONCLUIDA')).toBe(true);
  });

  it('falta emprestada entra na lista de emprestimos e pode ser devolvida em lote', async () => {
    const emprestada = await request(app.getHttpServer())
      .post('/shortages')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({
        nomePeca: 'Peca emprestada e2e',
        qtdRestante: 0,
        emprestada: true,
        emprestadaDe: 'Loja Parceira',
      })
      .expect(201);

    const pendentes = await request(app.getHttpServer())
      .get('/emprestimos?status=PENDENTE')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .expect(200);

    const emprestimo = pendentes.body.find(
      (e: { shortageId: string }) => e.shortageId === emprestada.body.id,
    );
    expect(emprestimo).toBeDefined();
    expect(emprestimo.emprestadaDe).toBe('Loja Parceira');
    expect(emprestimo.pecaNome).toBe('PECA EMPRESTADA E2E');

    const devolvidos = await request(app.getHttpServer())
      .patch('/emprestimos/devolver')
      .set('Authorization', `Bearer ${vendedorToken}`)
      .send({ ids: [emprestimo.id], devolvidoPara: 'Joao da Loja Parceira' })
      .expect(200);

    expect(devolvidos.body[0].status).toBe('DEVOLVIDA');
    expect(devolvidos.body[0].devolvidoPara).toBe('Joao da Loja Parceira');
    expect(devolvidos.body[0].devolvidoPorNome).toBe('Vendedor E2E');
    expect(devolvidos.body[0].devolvidoEm).not.toBeNull();
  });
});

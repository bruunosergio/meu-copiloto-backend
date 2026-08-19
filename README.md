# Meu Copiloto — Backend

Assistente digital de reposição de estoque para varejo (primeiro segmento: autopeças). Substitui o caderno físico de faltas: o vendedor registra por **texto ou áudio no WhatsApp**, o sistema interpreta e confirma os dados, e o comprador trabalha sobre uma fila organizada no painel web.

> **Status:** Fase 1 — núcleo sem IA. Autenticação, gestão de usuários e ciclo de vida das faltas implementados via API REST. WhatsApp/IA entram na Fase 2.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/01-visao-produto.md](docs/01-visao-produto.md) | Problema, solução, personas, caso de uso central, escopo do MVP e métricas de sucesso |
| [docs/02-modelo-dominio.md](docs/02-modelo-dominio.md) | Entidades, invariantes, ciclo de vida da falta e matriz de permissões |
| [docs/03-arquitetura.md](docs/03-arquitetura.md) | Arquitetura hexagonal, estrutura de pastas, fluxo do webhook, regras invioláveis |
| [docs/04-roadmap.md](docs/04-roadmap.md) | Fases 0–4 com entregas e critérios de aceite |
| [docs/05-estrategia-multi-loja.md](docs/05-estrategia-multi-loja.md) | Como escalar de 1 loja para N: multi-tenant, hospedagem e o que fazer antes da 2ª loja |
| [docs/adr/](docs/adr/README.md) | Decisões de arquitetura registradas (ADRs) |

## Stack

| Categoria | Escolha |
|---|---|
| Backend | Node.js + TypeScript (NestJS), arquitetura hexagonal |
| Banco | PostgreSQL + Prisma (ver ADR-0005) |
| Autenticação | JWT (access token único; ver seção Decisões da Fase 1) |
| Captura (Fase 2) | WhatsApp Cloud API (oficial) — ver ADR-0003 |
| Interpretação (Fase 2) | STT (Whisper) + LLM com extração validada por schema — ver ADR-0004 |
| Painel web | React + TypeScript — repositório [`meu-copiloto-web`](../meu-copiloto-web) |

## Como rodar localmente

Pré-requisitos: Node.js 20+, npm, Docker Desktop (para o PostgreSQL).

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# edite .env se quiser trocar usuário/senha/segredo padrão

# 3. Subir o PostgreSQL
docker compose up -d

# 4. Gerar o client do Prisma e aplicar as migrations
npm run prisma:generate
npm run prisma:migrate

# 5. Popular a loja piloto + usuário admin inicial
npm run seed

# 6. Rodar o backend em modo desenvolvimento
npm run start:dev
```

O servidor sobe em `http://localhost:3000` (configurável via `PORT`). Login inicial: o e-mail e a senha definidos em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` no `.env` (troque a senha padrão antes de usar fora do seu ambiente local).

### Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com hot-reload |
| `npm run build` | Compila para `dist/` |
| `npm run lint` | ESLint com correção automática |
| `npm test` | Testes unitários (Jest) dos use cases do domínio |
| `npm run test:e2e` | Testes end-to-end (Supertest) contra um Postgres real — ver aviso abaixo |
| `npm run prisma:studio` | Interface visual do banco |
| `npm run prisma:migrate` | Cria/aplica uma nova migration em desenvolvimento |

> **Sobre os testes e2e:** `test/shortages-flow.e2e-spec.ts` sobe a aplicação real e bate no Postgres apontado por `DATABASE_URL`. Rode contra um banco descartável (o mesmo do `docker compose up` serve, desde que as migrations já tenham sido aplicadas) — o teste cria e remove seus próprios dados ao final.

## Endpoints da Fase 1

Todas as rotas abaixo (exceto `/auth/login`) exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Papel exigido | Descrição |
|---|---|---|---|
| GET | `/health` | — | Disponibilidade (alvo do keep-alive e de monitoramento externo) |
| POST | `/auth/login` | — | `{ email, senha }` → `{ token, user }` |
| GET | `/users` | ADMIN | Lista usuários da loja |
| POST | `/users` | ADMIN | Cria usuário (`nome`, `email`, `senha`, `papel`, `telefoneWhatsapp?`) |
| PATCH | `/users/:id` | ADMIN | Atualiza dados/papel/ativo |
| PATCH | `/users/:id/deactivate` | ADMIN | Desativa usuário |
| POST | `/shortages` | qualquer autenticado | Registra falta (`nomePeca`, `qtdRestante`, `codigoPeca?`, `observacao?`) |
| GET | `/shortages?status=REGISTRADA,EM_COTACAO` | qualquer autenticado | Lista faltas — vendedor só vê as próprias; admin/comprador veem a fila completa |
| GET | `/shortages/:id` | qualquer autenticado | Detalhe de uma falta |
| PATCH | `/shortages/:id/status` | ADMIN/COMPRADOR | Transição operacional (`novoStatus`: `EM_COTACAO`\|`COMPRADA`\|`RECEBIDA`; `distribuidoraId?` só aceito ao ir para `COMPRADA`) |
| PATCH | `/shortages/:id/distribuidora` | ADMIN/COMPRADOR | Define/corrige a distribuidora vencedora fora do momento da transição (`distribuidoraId` ou `null` para limpar) |
| PATCH | `/shortages/:id/cancel` | ver regra | Cancela (`motivo` obrigatório) — admin/comprador sempre; vendedor só a própria falta em `REGISTRADA` |
| GET | `/distribuidoras` | qualquer autenticado | Lista distribuidoras da loja (ativas e inativas) |
| POST | `/distribuidoras` | ADMIN | Cadastra distribuidora (`nome`) |
| PATCH | `/distribuidoras/:id/deactivate` | ADMIN | Desativa (some do seletor rápido, mantém histórico) |
| PATCH | `/distribuidoras/:id/reactivate` | ADMIN | Reativa |

## Decisões técnicas da Fase 1 (complementam os ADRs)

- **JWT sem refresh token por ora** — proporcional ao tamanho do MVP (uma loja, poucos usuários). Token de acesso único com expiração configurável (`JWT_EXPIRES_IN`, padrão 8h — a duração de um turno). Reavaliar se o produto crescer.
- **`bcryptjs`** em vez de `bcrypt` — evita compilação nativa no Windows.
- **Uma loja semeada por script** — não há tela de CRUD de lojas ainda (isso é Fase 4); o `storeId` já existe em todas as tabelas.
- **`RawCapture` fora do schema** — só entra no banco a partir da Fase 2, quando o WhatsApp existir de fato.

## Como este projeto se organiza

O padrão de engenharia segue o projeto INBORDAL: camadas com dependências apontando sempre para o `domain`, portas de entrada/saída como contratos, composition root único e README como manual de arquitetura. As regras completas, a estrutura de pastas e os diagramas de fluxo estão em [docs/03-arquitetura.md](docs/03-arquitetura.md).

Resumo das regras invioláveis:

- `domain/` não importa nada de NestJS, Prisma ou qualquer framework — nem decorators (`@Injectable`, `@Inject`). Os `*UseCaseImpl` são classes puras, instanciadas manualmente via `useFactory` em `config/modules/domain.module.ts`.
- `api/` só conhece as interfaces de `domain/ports/input`, nunca os `usecases/` ou a `infra/` diretamente.
- `infra/` implementa `domain/ports/output` e não conhece `ports/input`.
- Implementações concretas (`PrismaUserRepository`, `BcryptPasswordHasher`, `JwtTokenProvider`...) só são referenciadas dentro de `config/modules/`.

## Como implementar uma nova feature

1. **Domain**: entidade (se necessário) em `domain/entities/`; contrato de saída em `domain/ports/output/`; método novo (ou interface nova, se for feature nova) em `domain/ports/input/`; implementação em `domain/usecases/` — classe pura, sem decorators.
2. **Infra**: implemente o repositório/adapter em `infra/repositories/` ou `infra/security/`, com mapper em `infra/mappers/` se envolver o banco.
3. **API**: DTO em `api/rest/<recurso>/`, controller consumindo a porta de entrada via `@Inject(TOKEN_DA_USE_CASE)`.
4. **Wiring**: registre a implementação em `config/modules/infra.module.ts` (`{ provide: TOKEN, useClass: Implementacao }`) e a use case em `config/modules/domain.module.ts` (`useFactory` + `inject`).
5. **Testes**: teste unitário do use case em `domain/usecases/*.spec.ts` usando os fakes de `domain/usecases/__fakes__/`; se o fluxo envolver mais de uma rota, cubra em `test/*.e2e-spec.ts`.

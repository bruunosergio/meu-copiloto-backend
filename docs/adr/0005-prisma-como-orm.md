# ADR-0005 — Prisma como ORM/query builder

**Status:** Aceito (2026-08-04)

## Contexto

O ADR-0002 definiu NestJS como framework, mas deixou em aberto a escolha entre TypeORM e Prisma para o acesso ao PostgreSQL. Essa decisão precisava ser fechada antes de iniciar a Fase 1.

## Decisão

Usar **Prisma** como ORM:

- `prisma/schema.prisma` como fonte de verdade do esquema, espelhando `docs/02-modelo-dominio.md`.
- Migrations versionadas em `prisma/migrations/`.
- `PrismaService` (em `infra/database/`) encapsula o `PrismaClient` como singleton do NestJS; nenhuma outra camada importa `@prisma/client` diretamente — só `infra/repositories` e `infra/mappers`.
- Os tipos gerados pelo Prisma nunca cruzam para `domain/`; os `mappers` convertem o modelo Prisma na entidade de domínio correspondente.

## Alternativas consideradas

- **TypeORM:** mais tradicional em projetos NestJS (decorators nas entidades), mas o acoplamento entre entidade de banco e classe de domínio é mais tentador de burlar — o time preferiu a separação mais explícita que o Prisma Client (gerado, imutável, fora do `domain`) impõe.

## Consequências

- Positiva: migrations declarativas e `prisma migrate dev` aceleram a Fase 1.
- Positiva: client type-safe reduz erros de mapeamento entre banco e mappers.
- Negativa: mais uma ferramenta de build (`prisma generate`) precisa rodar após `npm install` e após qualquer mudança de schema — documentado no README.

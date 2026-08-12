# Arquitetura — Meu Copiloto

> Arquitetura hexagonal (ports & adapters) no backend NestJS, com o WhatsApp e a API REST como adapters de entrada e Postgres/IA/WhatsApp como adapters de saída. Segue o mesmo padrão de rigor do projeto INBORDAL: dependências sempre apontando para o domínio, regras invioláveis, roteiro de feature.

## 1. Visão geral da solução

```mermaid
flowchart LR
    vendedor[Vendedor] -->|"texto/áudio"| whatsapp[WhatsApp Cloud API]
    whatsapp -->|webhook| backend[Backend NestJS]
    backend --> pipeline[Pipeline de interpretação]
    pipeline -->|"transcrição (Whisper)"| pipeline
    pipeline -->|"extração LLM: código, nome, qtd"| backend
    backend -->|"mensagem de confirmação (botões)"| whatsapp
    backend --> db[(PostgreSQL)]
    painel[Painel Web - React] --> backend
    admin[Admin] --> painel
    comprador[Comprador] --> painel
```

Componentes:

- **Backend (este repositório)** — NestJS + TypeScript. Expõe a API REST do painel e o webhook do WhatsApp; orquestra o pipeline de interpretação; persiste em PostgreSQL.
- **Painel web (repositório `meu-copiloto-web`)** — React + TypeScript. Login, administração, fila de faltas do comprador, dashboard.
- **Serviços externos** — WhatsApp Cloud API (mensagens), STT (transcrição de áudio), LLM (extração estruturada). Todos atrás de portas de saída.

## 2. As camadas (hexagonal)

```
                chama / aciona                implementa contrato
   api  ──────────────────────────►  domain  ◄─────────────────────────  infra
(entrada:                            (núcleo,                            (saída:
REST + webhook,                     regra pura)                    Postgres, WhatsApp,
driving adapters)                                                  STT, LLM — driven)

     └──────────────── ambos dependem só de domain ────────────────┘
```

- `api` e `infra` nunca se enxergam: toda comunicação passa pelas **portas** (interfaces) do `domain`.
- O `domain` não importa nada de framework — nem NestJS, nem ORM, nem SDK de terceiros.
- Só o composition root (`config/`) conhece implementações concretas.

## 3. Estrutura de pastas do backend

```
src/
├── main.ts                    # bootstrap do NestJS
│
├── domain/
│   ├── core/
│   │   └── result/            # Result<T> (Ok/Err) + Unit — retorno padrão em vez de exceptions
│   ├── entities/              # Store, User, Shortage, RawCapture, StatusTransition
│   ├── failures/              # Failure base + falhas concretas (NotFound, InvalidTransition, Unauthorized...)
│   ├── ports/
│   │   ├── input/             # o que o núcleo OFERECE: 1 interface por feature/contexto
│   │   │                      #   AuthUseCase, UserManagementUseCase, ShortageUseCase, CaptureUseCase, DashboardUseCase
│   │   └── output/            # o que o núcleo PRECISA:
│   │                          #   UserRepository, ShortageRepository, RawCaptureRepository,
│   │                          #   MessagingPort (enviar msg/botões), TranscriptionPort, ExtractionPort
│   └── usecases/              # implementações das portas de entrada (regra de negócio pura)
│
├── infra/
│   ├── database/              # TypeORM/Prisma: schemas, migrations, conexão
│   ├── repositories/          # implementam ports/output combinando database + mappers
│   ├── mappers/               # linha do banco / payload externo → entidade de domínio
│   ├── whatsapp/              # adapter da Cloud API: implementa MessagingPort (envio)
│   ├── ai/                    # adapters de STT (TranscriptionPort) e LLM (ExtractionPort)
│   └── exceptions/            # erros técnicos e tradução para Failure
│
├── api/
│   ├── rest/                  # controllers REST do painel (auth, users, shortages, dashboard) + DTOs
│   ├── webhook/               # controller do webhook WhatsApp (verificação + recepção de mensagens)
│   └── guards/                # autenticação JWT, autorização por papel
│
└── config/
    ├── modules/               # módulos NestJS que ligam interface → implementação (composition root)
    └── env/                   # validação de variáveis de ambiente
```

### Regras que não podem ser violadas

- `domain` não importa nada de `infra`, `api` ou framework.
- `api` importa só `ports/input` (interfaces), nunca `usecases/` nem `infra/`.
- `infra` implementa `ports/output` e não conhece `ports/input`.
- Implementações concretas só são referenciadas dentro de `config/modules/`.
- Ação nova em feature existente = método novo na interface existente, não interface nova.
- Use cases e repositórios retornam `Result<T>` em vez de lançar exceção; exceções técnicas morrem na `infra`, traduzidas em `Failure`.

## 4. Fluxo do webhook (captura via WhatsApp)

```mermaid
sequenceDiagram
    participant V as Vendedor (WhatsApp)
    participant M as Meta Cloud API
    participant W as api/webhook
    participant C as CaptureUseCase (domain)
    participant AI as infra/ai (STT + LLM)
    participant DB as infra (Postgres)

    V->>M: áudio ou texto
    M->>W: POST /webhook (payload)
    W->>C: capture(telefone, conteudo)
    C->>C: valida telefone cadastrado e ativo
    C->>AI: transcrever (se áudio)
    C->>AI: extrair {codigo, nome, qtd, obs}
    C->>DB: salva RegistroBruto
    C->>M: envia resumo + botões Confirmar/Corrigir
    V->>M: toca Confirmar
    M->>W: POST /webhook (resposta do botão)
    W->>C: confirm(captureId)
    C->>DB: cria Falta (status REGISTRADA)
    C->>M: envia confirmação final
```

Pontos de atenção de implementação:

- O webhook deve responder 200 rápido e processar de forma assíncrona (a Meta reenvia em caso de timeout) — fila interna simples no MVP.
- Idempotência por `message_id` da Meta: reentregas não podem duplicar capturas.
- Captura pendente (aguardando confirmação) expira após janela configurável; expiração marca o `RegistroBruto` como `ABANDONADO`.

## 5. Autenticação e autorização

- **Painel web:** login com e-mail/senha → JWT (access + refresh). Guards do NestJS aplicam papel (`ADMIN`, `VENDEDOR`, `COMPRADOR`) por rota; a regra de negócio de permissão (ex.: vendedor só cancela a própria falta) vive no domínio.
- **Webhook:** verificação do token da Meta (challenge na configuração) + validação de assinatura `X-Hub-Signature-256` em toda requisição.
- **Identidade no WhatsApp:** o telefone remetente é resolvido para um `User` ativo; telefone desconhecido recebe resposta educada e nada é registrado.

## 6. Painel web (repositório separado)

React + TypeScript com a mesma disciplina de camadas adaptada ao front (semelhante à divisão `ui`/`domain`/`infra` do INBORDAL mobile): componentes/páginas não chamam HTTP diretamente — consomem interfaces de caso de uso, com implementações HTTP injetadas no composition root. Detalhamento no README daquele repositório quando for criado (Fase 1).

## 7. Decisões registradas

As decisões estruturais e suas alternativas estão nos ADRs:

- [ADR-0001 — Canal híbrido](adr/0001-canal-hibrido-whatsapp-e-painel-web.md)
- [ADR-0002 — Node/TypeScript + NestJS hexagonal](adr/0002-backend-node-typescript-nestjs.md)
- [ADR-0003 — API oficial da Meta](adr/0003-api-oficial-whatsapp-cloud.md)
- [ADR-0004 — Pipeline de IA com confirmação humana](adr/0004-pipeline-ia-com-confirmacao-humana.md)

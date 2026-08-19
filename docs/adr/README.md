# Registros de Decisão de Arquitetura (ADRs)

Cada decisão relevante de arquitetura fica registrada aqui, numerada e imutável: se uma decisão mudar, escreve-se um novo ADR que **substitui** o anterior (marcando o antigo como "Substituído por ADR-XXXX"), preservando o histórico do porquê.

## Formato

Cada ADR segue a estrutura:

- **Status** — Aceito, Proposto, Substituído por ADR-XXXX
- **Contexto** — o problema e as forças em jogo
- **Decisão** — o que foi decidido
- **Alternativas consideradas** — o que foi descartado e por quê
- **Consequências** — o que a decisão implica (positivas e negativas)

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](0001-canal-hibrido-whatsapp-e-painel-web.md) | Canal híbrido: WhatsApp para captura, painel web para gestão | Aceito |
| [0002](0002-backend-node-typescript-nestjs.md) | Backend em Node.js/TypeScript com NestJS e arquitetura hexagonal | Aceito |
| [0003](0003-api-oficial-whatsapp-cloud.md) | Integração exclusivamente pela API oficial (Meta Cloud API) | Aceito |
| [0004](0004-pipeline-ia-com-confirmacao-humana.md) | Pipeline de interpretação com IA e confirmação humana obrigatória | Aceito |
| [0005](0005-prisma-como-orm.md) | Prisma como ORM/query builder | Aceito |
| [0006](0006-hospedagem-piloto-gratuita.md) | Hospedagem do piloto: Neon + Render + Vercel (camada gratuita) | Aceito |
| [0007](0007-login-loja-e-pin-vendedor.md) | Vendedor loga pelo terminal da loja (código+senha) e PIN pessoal, não e-mail+senha | Aceito |

# ADR-0002 — Backend em Node.js/TypeScript com NestJS e arquitetura hexagonal

**Status:** Aceito (2026-08-04)

## Contexto

O backend precisa: expor API REST para o painel web, receber webhooks da WhatsApp Cloud API, orquestrar um pipeline de IA (transcrição + extração) e persistir o domínio em banco relacional. A equipe valoriza a organização do projeto INBORDAL (arquitetura hexagonal com camadas `domain` / `infra` / `ui` e regras de dependência estritas) e quer replicar esse rigor.

## Decisão

- **Node.js + TypeScript** com **NestJS** como framework HTTP/DI.
- **Arquitetura hexagonal (ports & adapters)** no mesmo espírito do INBORDAL: núcleo `domain/` puro (sem NestJS, sem ORM), adapters de entrada (REST, webhook WhatsApp) e de saída (Postgres, WhatsApp, transcrição, LLM), composition root único.
- **PostgreSQL** como banco relacional.
- Detalhes de estrutura de pastas e regras de dependência no documento de [arquitetura](../03-arquitetura.md).

## Alternativas consideradas

- **Java/Spring Boot:** maduro, mas mais verboso e com ciclo de desenvolvimento mais lento para um MVP solo.
- **Python/FastAPI:** ótimo para o pipeline de IA, mas dividiria a base em dois ecossistemas (painel web já será TypeScript); o pipeline de IA consome APIs externas, não exige Python.
- **Node "puro" (Express/Fastify):** menos estrutura pronta de DI e módulos; NestJS entrega injeção de dependência que facilita respeitar as portas da arquitetura hexagonal.

## Consequências

- Positiva: uma única linguagem (TypeScript) em backend e frontend web — menos troca de contexto.
- Positiva: DI nativa do NestJS torna natural o padrão "UI depende de interface, composition root liga implementações".
- Negativa: NestJS induz a colocar lógica em services acoplados ao framework; a disciplina hexagonal (domínio puro) precisa ser defendida em revisão de código e documentada no README.

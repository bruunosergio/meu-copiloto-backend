# ADR-0003 — Integração exclusivamente pela API oficial (Meta WhatsApp Cloud API)

**Status:** Aceito (2026-08-04)

## Contexto

Existem duas vias de integração com WhatsApp:

1. **API oficial (WhatsApp Business Platform / Cloud API)** — exige conta business verificada na Meta, número dedicado e aprovação. Conversas de atendimento iniciadas pelo usuário (nosso caso: o vendedor sempre inicia) operam sem custo por mensagem na janela de serviço, e a API oferece mensagens interativas (botões, listas) ideais para o fluxo de confirmação.
2. **Bibliotecas não oficiais** (Baileys, wppconnect, etc.) — gratuitas e sem burocracia, mas violam os termos de uso da Meta; o número pode ser **banido sem aviso**, derrubando o canal de captura de todos os clientes de uma vez.

Este produto será comercializado para outras lojas: a confiabilidade do canal é requisito de negócio, não detalhe técnico.

## Decisão

Usar **exclusivamente a API oficial (Cloud API)**, com webhook próprio no backend. Bibliotecas não oficiais estão vetadas em qualquer ambiente, inclusive protótipos que possam vazar para produção.

O processo de verificação do negócio na Meta deve ser iniciado na Fase 0 (é burocrático e roda em paralelo ao desenvolvimento). Para desenvolvimento, usa-se o número de teste que a própria plataforma fornece.

## Alternativas consideradas

- **Bibliotecas não oficiais:** descartadas pelo risco de banimento — inaceitável para produto comercial.
- **BSPs intermediários (Twilio, Z-API, 360dialog):** adicionam custo por mensagem e uma camada de dependência; a Cloud API direta atende o volume do MVP. Podem ser reavaliados na fase multi-tenant se o onboarding de números por loja se mostrar pesado (um ADR novo registraria essa mudança).

## Consequências

- Positiva: canal estável, dentro dos termos, com botões interativos para o fluxo Confirmar/Corrigir.
- Positiva: custo próximo de zero no MVP (conversas iniciadas pelo usuário).
- Negativa: burocracia de verificação da Meta antes de ir a produção — mitigada começando o processo já na Fase 0.
- Negativa: cada loja cliente precisará de número/conta vinculados — processo de onboarding a desenhar na fase de generalização.

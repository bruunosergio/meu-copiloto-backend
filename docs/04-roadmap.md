# Roadmap — Meu Copiloto

> Cinco fases, cada uma com entregas e critérios de aceite objetivos. Uma fase só começa quando os critérios da anterior estiverem atendidos (exceto trilhas paralelas explicitamente marcadas).

## Fase 0 — Fundação (planejamento e setup)

**Objetivo:** base documental e de projeto pronta para desenvolver com disciplina.

Entregas:

- Documentos de planejamento: visão de produto, modelo de domínio, arquitetura, ADRs, este roadmap.
- Repositório backend criado com git, `.gitignore` e README de arquitetura.
- **Trilha paralela (começa já, corre durante as fases 1–2):** abrir o processo de verificação do WhatsApp Business na Meta — conta business, número dedicado, aprovação. É burocrático e não pode virar gargalo da Fase 2.

Critérios de aceite:

- [ ] Documentos revisados e aprovados pelo dono do produto.
- [ ] Processo de verificação na Meta iniciado (conta criada, documentação submetida).

## Fase 1 — Núcleo sem IA (substitui o caderno)

**Objetivo:** sistema já utilizável na loja piloto com registro manual — valida o fluxo de trabalho antes de investir no canal WhatsApp.

Entregas:

- Backend: autenticação JWT com papéis, CRUD de usuários (admin), CRUD de faltas com ciclo de vida completo (`REGISTRADA → EM_COTACAO → COMPRADA → RECEBIDA` / `CANCELADA`) e histórico de transições.
- Banco PostgreSQL com migrations e `store_id` em todas as tabelas.
- Painel web: login, administração de usuários, formulário de registro de falta, **tela de faltas do comprador** (filtros por status/data/vendedor, agrupamento, transição de status, ações em lote).
- Deploy em ambiente acessível pela loja piloto.

> **Status de implementação (2026-08-12):** backend e painel web escritos e testados (unitários + e2e do backend, todos passando contra Postgres real). Deploy em produção concluído e acessível pela internet: backend no Render (`https://meu-copiloto-backend.onrender.com`), painel no Vercel (`https://meu-copiloto-web.vercel.app`), banco no Neon — ver ADR-0006. Fila do comprador redesenhada para lista em linhas com seções por status expansíveis/recolhíveis. Falta apenas o uso real e contínuo na loja piloto para fechar o último critério.

Critérios de aceite:

- [x] Admin cria usuário vendedor e comprador; cada papel enxerga só o que a matriz de permissões permite. _(verificado via suíte e2e do backend)_
- [ ] Vendedor registra falta pelo formulário web em menos de 30 segundos. _(painel está em uso/teste em produção; falta cronometrar formalmente)_
- [x] Comprador conduz uma falta por todo o ciclo de vida sem tocar no banco; transição inválida é rejeitada. _(verificado via suíte e2e do backend)_
- [ ] Loja piloto operando: faltas reais da semana registradas no sistema. _(depende de uso real e contínuo na loja — ainda em validação)_

## Fase 2 — WhatsApp + IA (o diferencial)

**Objetivo:** captura por texto e áudio no WhatsApp com interpretação e confirmação.

Entregas:

- Webhook da Cloud API (verificação, assinatura, idempotência por `message_id`, processamento assíncrono).
- Pipeline: transcrição de áudio (STT) → extração estruturada (LLM com schema validado) → mensagem de confirmação com botões → criação da falta.
- Persistência de `RegistroBruto` para toda captura, com resultado (confirmado/corrigido/abandonado).
- Expiração de capturas pendentes; resposta educada a números não cadastrados.
- Métrica de precisão da interpretação exposta (mesmo que só em consulta interna).

Critérios de aceite:

- [ ] Áudio real de vendedor no ambiente da loja (ruído de balcão) vira falta confirmada sem edição em pelo menos 85% dos casos após 2 semanas de ajuste de prompts.
- [ ] Reentrega de webhook pela Meta não duplica captura nem falta.
- [ ] Número não cadastrado não cria nenhum registro de falta.
- [ ] Vendedores da loja piloto migraram do formulário web para o WhatsApp espontaneamente.

## Fase 3 — Dashboard estratégico

**Objetivo:** transformar os dados acumulados em decisão de compra.

Entregas:

- Dashboard do admin: faltas recorrentes (mesma peça em janela de tempo), tempo médio por etapa do ciclo (registro→cotação→compra→recebimento), volume por vendedor/período, itens críticos abertos há mais de N dias.
- Visão operacional do comprador: fila priorizada por idade e recorrência.
- Alertas simples (ex.: falta aberta há mais de X dias).

Critérios de aceite:

- [ ] Dashboard identifica corretamente ao menos um caso real de falta recorrente na loja piloto que gere ajuste de estoque mínimo.
- [ ] Tempos de ciclo calculados a partir do histórico de transições batem com conferência manual.

## Fase 4 — Generalização (produto vendável)

**Objetivo:** de piloto de uma loja para produto multi-loja e multi-segmento.

Entregas:

- Multi-tenant operacional: onboarding de loja (conta, número WhatsApp, usuários), isolamento por `store_id` auditado de ponta a ponta.
- Vocabulário configurável por segmento (rótulos de "peça"/"código" adaptáveis a mercado, farmácia etc.).
- Prompt de extração parametrizado por segmento.
- Avaliação formal (novo ADR) de app mobile nativo como canal alternativo para lojas que não queiram WhatsApp — se aprovado, app Flutter no padrão INBORDAL.
- Revisão de custos por loja (mensagens, STT, LLM) e modelo de precificação.

Critérios de aceite:

- [ ] Segunda loja (idealmente de outro segmento) operando sem nenhuma alteração de código específica para ela.
- [ ] Teste de isolamento: nenhum dado de uma loja acessível por usuários de outra.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Verificação da Meta atrasar | Fase 2 bloqueada | Trilha paralela desde a Fase 0; número de teste da plataforma para desenvolvimento |
| Precisão da interpretação abaixo da meta | Vendedores desistem do canal | `RegistroBruto` alimenta ajuste de prompts; confirmação humana impede dado errado no banco |
| Adoção fraca na loja piloto | Produto não validado | Fase 1 entrega valor sem IA; acompanhamento presencial nas primeiras semanas |
| Dependência da Meta (política/preço) | Canal principal em risco | Fallback web sempre disponível; canal é adapter trocável (ADR-0001) |

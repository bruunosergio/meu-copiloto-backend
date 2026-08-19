# Estratégia Multi-Loja — Meu Copiloto

> Como o produto sai de "piloto em uma loja de autopeças" para "produto vendável em N lojas" sem retrabalho: um código só, uma infraestrutura só, várias lojas isoladas por `store_id`. Este documento registra o raciocínio; a execução técnica detalhada pertence à Fase 4 do [roadmap](04-roadmap.md).

## 1. Decisão central: multi-tenant, nunca um repositório por loja

**Um único repositório, um único deploy, um único banco — todas as lojas dentro dele, isoladas por `store_id`.**

O modelo "um repositório/deploy por loja" (single-tenant replicado) parece dar mais isolamento, mas é uma armadilha operacional para um produto:

| | Um repo/deploy por loja | Multi-tenant (escolhido) |
|---|---|---|
| Corrigir um bug | N repositórios, N deploys, N bancos | 1 deploy atende todas |
| Versão em produção | Cada loja numa versão diferente — caos | Todas sempre na mesma versão |
| Custo de infra | Cresce linearmente (10 lojas = 10 backends) | Quase fixo; a receita escala, o custo não |
| Vender loja nova | "Fazer uma instalação" | Criar um registro no banco |

O terreno já foi preparado na Fase 0: **toda entidade carrega `store_id` desde o dia 1** (ver [modelo de domínio](02-modelo-dominio.md), seção 2.1). Vender para uma loja nova é uma operação de cadastro, não de engenharia.

## 2. O que separa a Fase 1 do multi-tenant real

A Fase 1 tem um único atalho consciente que amarra o sistema a uma loja: o login resolve o usuário dentro do `DEFAULT_STORE_ID` fixo (a loja-piloto). Para operar a segunda loja em diante:

1. **Login resolve a loja pelo usuário** — o e-mail já é único por loja e o JWT já carrega `storeId`; trata-se de remover o atalho, não de redesenhar.
2. **Rotina de onboarding de loja** — criar loja + admin inicial + distribuidoras iniciais (hoje é o papel do seed; vira operação de cadastro do dono do produto).
3. **Auditoria de isolamento** — revisar que toda query filtra por `store_id` de ponta a ponta (a maior parte já filtra; é revisão, não reescrita).

**Gatilho:** este trabalho deve estar pronto **antes de fechar a segunda loja**. Feito antes, é pequeno e sem pressa; feito depois, é dor de cabeça com dados reais em produção.

## 3. Hospedagem: piloto agora, produto depois

Infra atual (ver [ADR-0006](adr/0006-hospedagem-piloto-gratuita.md)): Neon + Render + Vercel, camada gratuita, deploy automático via GitHub.

- **Piloto (agora, custo zero):** suficiente. O cold start do Render (~30-50s após 15 min ocioso) é mitigado com um ping externo gratuito no horário comercial (implementado via GitHub Actions — ver `.github/workflows/keep-alive.yml`).
- **Primeira loja pagante:** mesma arquitetura, planos pagos — Render Starter (elimina o cold start) + Neon pago (mais armazenamento e retenção de backup). Ordem de grandeza: **US$ 10–25/mês para atender todas as lojas**, não por loja.
- **Profissionalização mínima antes de vender:** domínio próprio (ex.: `meucopiloto.com.br`) apontando para Vercel/Render; rotina de backup do Neon confirmada (as faltas são o "caderno" da loja — perder dados é perder o cliente); monitoramento de disponibilidade (UptimeRobot gratuito ou similar).
- Quando o volume justificar, revisitar com novo ADR (previsto no ADR-0006).

## 4. Personalização é dado, não código

Tudo que varia de loja para loja mora no banco, vinculado ao `store_id` — nunca em código ou variável de ambiente:

| O que varia | Como já está / como fica |
|---|---|
| Usuários e papéis | Por loja (pronto) |
| Distribuidoras | Por loja (pronto) |
| Segmento e vocabulário ("peça", "código da peça") | Campo `segmento` existe; rótulos configuráveis na Fase 4 (ver seção 6 do modelo de domínio) |
| Número WhatsApp (Fase 2) | Campo `whatsappNumero` por loja já existe |

**Sinal de alerta:** se uma loja pedir algo que exigiria `if (loja === X)` no código, a resposta é: ou vira configuração genérica que qualquer loja liga/desliga, ou não entra no produto.

## 5. Sequência recomendada

1. **Agora:** operar a loja piloto como está; o uso real dita as prioridades.
2. **Antes da 2ª loja:** remover `DEFAULT_STORE_ID` do login + onboarding de loja + auditoria de isolamento (itens da seção 2).
3. **Na 1ª venda:** domínio próprio, planos pagos, backup verificado.
4. **Ao bater o martelo técnico do multi-tenant:** registrar em ADR próprio (banco compartilhado vs. schema por loja vs. banco por loja — a recomendação atual é banco compartilhado com `store_id`, o mais simples que atende).

## 6. Pontos de negócio em aberto (não bloqueiam o piloto)

- **Precificação por loja:** mensalidade fixa? Por usuário? Por volume de faltas? Influencia a revisão de custos prevista na Fase 4.
- **Onboarding manual vs. self-service:** cadastro de loja feito pelo dono do produto é suficiente até ~10-20 lojas; auto-cadastro só se justifica depois — não construir antes da demanda.
- **Contrato/LGPD:** o sistema guarda dados de funcionários (nome, e-mail, telefone). Antes de vender, definir termos de uso e responsabilidade sobre os dados.

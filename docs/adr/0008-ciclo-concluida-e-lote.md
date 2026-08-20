# ADR-0008 — Ciclo da falta sem etapa de cotação; conclusão e recebimento em lote

**Status:** Aceito (2026-08-19)

## Contexto

O uso na loja piloto mostrou que “Iniciar cotação” não guarda informação útil: a cotação dura minutos e o comprador já fecha o pedido na mesma passagem. O clique extra atrasava o expediente. Na mesma sessão, o comprador costuma fechar **várias peças no mesmo pedido** (uma distribuidora, um lote) e, depois, conferir várias peças que chegaram juntas.

## Decisão

- O status `EM_COTACAO` é eliminado. `COMPRADA` é renomeado para `CONCLUIDA` (pedido feito na distribuidora vencedora).
- Ciclo: `REGISTRADA → CONCLUIDA → RECEBIDA`, com `CANCELADA` a partir de `REGISTRADA`.
- “Marcar como concluída” abre o seletor rápido de distribuidora (opcional; “decidir depois” continua válido). A escolha pode ser corrigida depois sem nova transição.
- Transição em lote (`PATCH /shortages/status`): um conjunto de faltas no mesmo status avança junto. Conclusão do lote usa **uma** distribuidora para todas; recebimento do lote não pede distribuidora. Validação é tudo-ou-nada.
- Dados antigos: `EM_COTACAO` volta para `REGISTRADA`; `COMPRADA` vira `CONCLUIDA`.

## Alternativas consideradas

- Manter `EM_COTACAO` só na UI, sem mudar o domínio — a fila continuaria mentindo sobre o trabalho real.
- Um pedido/agrupamento como entidade nova — cedo demais; o lote é uma ação, não um agregado persistido.
- “Concluída” encerrar o ciclo (sem `RECEBIDA`) — perderia a lista do que está a caminho do estoque.

## Consequências

- Positiva: a fila reflete o expediente (registrar → pedir → receber).
- Positiva: um pedido com várias peças vira um clique + uma escolha de distribuidora.
- Negativa: o nome `CONCLUIDA` pode ser lido como “já chegou”; o rótulo da próxima ação (“Marcar como recebida”) e a seção separada mitigam isso.

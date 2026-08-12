# ADR-0004 — Pipeline de interpretação com IA e confirmação humana obrigatória

**Status:** Aceito (2026-08-04)

## Contexto

A mensagem do vendedor chega livre: áudio com ruído de loja, texto com abreviações ("acabou o rolamento 6203, ficou 0"). O sistema precisa transformar isso em dados estruturados — `codigo_peca`, `nome_peca`, `qtd_restante`, `observacao` — com confiabilidade suficiente para o comprador basear compras nesses registros. Modelos de transcrição e extração erram, e um registro errado no banco é pior que nenhum registro (compra errada, confiança perdida).

## Decisão

Pipeline em três etapas, com **confirmação humana obrigatória** antes da persistência da falta:

1. **Transcrição** (somente áudio): modelo de speech-to-text (ex.: Whisper via API) converte o áudio em texto.
2. **Extração estruturada**: um LLM recebe o texto com um prompt de extração e devolve JSON validado contra schema (`codigo_peca?`, `nome_peca`, `qtd_restante`, `observacao?`). Campos ausentes ficam nulos — o modelo é instruído a **não inventar** código de peça.
3. **Confirmação**: o sistema responde no WhatsApp com o resumo estruturado e botões **Confirmar / Corrigir**. Só a confirmação cria a `Falta`. "Corrigir" abre novo ciclo de captura; abandono expira o registro pendente.

Toda captura gera um `RegistroBruto` (mensagem original, transcrição, extração, resultado), persistido **independentemente** da confirmação — é a auditoria e a base para medir e melhorar a precisão.

Fornecedores específicos de STT/LLM são detalhes de `infra/` atrás de portas de saída (`TranscriptionPort`, `ExtractionPort`) — trocáveis sem tocar no domínio, sem necessidade de novo ADR.

## Alternativas consideradas

- **Persistir direto, sem confirmação:** menos fricção, mas um erro de interpretação viraria compra errada; descartado enquanto a precisão medida não justificar (possível ADR futuro com auto-confirmação acima de um limiar de confiança).
- **Formulário estruturado no WhatsApp (fluxos/perguntas sequenciais):** mais confiável, porém lento — três ou quatro trocas de mensagem por falta mata a vantagem sobre o caderno.
- **Regex/parsing determinístico sem LLM:** barato, mas frágil demais para linguagem falada e vocabulário de autopeças.

## Consequências

- Positiva: nenhum dado entra na fila do comprador sem validação humana — confiança preservada.
- Positiva: `RegistroBruto` permite medir a taxa de acerto (meta > 85% no piloto) e refinar prompts com casos reais.
- Negativa: um toque a mais para o vendedor (botão Confirmar) — aceitável frente ao risco.
- Negativa: custo por mensagem de STT/LLM — irrelevante no volume do MVP, monitorado para escala.

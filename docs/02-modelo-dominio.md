# Modelo de Domínio — Meu Copiloto

> Entidades, invariantes, papéis e o ciclo de vida da falta. Este documento é a fonte de verdade do domínio; o código do `domain/` deve refleti-lo, e mudanças conceituais começam aqui.

## 1. Visão geral

```mermaid
erDiagram
    LOJA ||--o{ USUARIO : possui
    LOJA ||--o{ FALTA : possui
    USUARIO ||--o{ FALTA : registra
    FALTA ||--o| REGISTRO_BRUTO : "originada por"
    FALTA ||--o{ TRANSICAO_STATUS : "historico"
    USUARIO ||--o{ TRANSICAO_STATUS : executa
```

## 2. Entidades

### 2.1 Loja (`Store`)

Raiz do isolamento de dados. **Toda** entidade carrega `store_id` desde o dia 1, mesmo com o MVP operando com uma única loja (ver ADR sobre escopo do MVP).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | — |
| `nome` | texto | obrigatório |
| `segmento` | enum | `AUTOPECAS` no MVP; extensível (mercado, farmácia...) |
| `whatsapp_numero` | texto | número da Cloud API vinculado à loja |
| `ativa` | booleano | loja desativada bloqueia login e captura |

### 2.2 Usuário (`User`)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | — |
| `store_id` | uuid | obrigatório |
| `nome` | texto | obrigatório |
| `email` | texto | único por loja; credencial de login do painel |
| `senha_hash` | texto | nunca em texto puro (bcrypt/argon2) |
| `telefone_whatsapp` | texto | único global; identifica o autor da mensagem recebida no webhook |
| `papel` | enum | `ADMIN`, `VENDEDOR`, `COMPRADOR` |
| `ativo` | booleano | usuário inativo não loga nem registra falta |

Invariantes:

- Mensagem recebida de telefone **não cadastrado ou inativo** é recusada com resposta educada — nunca cria falta.
- Um usuário pode acumular papéis no futuro; no MVP, um papel por usuário é suficiente.

### 2.3 Falta (`Shortage`)

A entidade central do produto: um item que precisa ser reposto.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | — |
| `store_id` | uuid | obrigatório |
| `codigo_peca` | texto | código interno/fabricante; pode ser nulo se o vendedor não souber (o comprador completa) |
| `nome_peca` | texto | obrigatório |
| `qtd_restante` | inteiro >= 0 | quanto sobrou no estoque no momento do registro |
| `observacao` | texto | opcional (ex.: "cliente encomendou 2") |
| `registrado_por` | uuid (Usuário) | obrigatório |
| `origem` | enum | `WHATSAPP_AUDIO`, `WHATSAPP_TEXTO`, `WEB` |
| `status` | enum | ver ciclo de vida abaixo |
| `registro_bruto_id` | uuid | nulo quando origem = WEB |
| `criada_em` / `atualizada_em` | timestamp | — |

### 2.4 Registro Bruto (`RawCapture`)

Auditoria e matéria-prima para melhorar a interpretação. Guarda a mensagem exatamente como chegou.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | uuid | — |
| `store_id` | uuid | obrigatório |
| `telefone_origem` | texto | — |
| `tipo` | enum | `AUDIO`, `TEXTO` |
| `conteudo_original` | texto / referência de mídia | áudio armazenado em object storage; texto inline |
| `transcricao` | texto | nulo para texto |
| `extracao` | json | payload estruturado que o LLM devolveu |
| `resultado` | enum | `CONFIRMADO`, `CORRIGIDO`, `ABANDONADO` |
| `criado_em` | timestamp | — |

A taxa `CONFIRMADO / total` é a métrica de precisão da interpretação (meta > 85% no piloto).

### 2.5 Transição de Status (`StatusTransition`)

Histórico imutável de mudanças de status da falta — alimenta o dashboard (tempo de ciclo, gargalos).

| Campo | Tipo |
|---|---|
| `id` | uuid |
| `falta_id` | uuid |
| `de` / `para` | enum de status |
| `executada_por` | uuid (Usuário) |
| `ocorrida_em` | timestamp |

## 3. Ciclo de vida da falta

```mermaid
stateDiagram-v2
    [*] --> REGISTRADA : vendedor confirma no WhatsApp / registro web
    REGISTRADA --> EM_COTACAO : comprador inicia cotação
    EM_COTACAO --> COMPRADA : pedido feito ao fornecedor
    COMPRADA --> RECEBIDA : mercadoria conferida no estoque
    REGISTRADA --> CANCELADA : duplicada / engano
    EM_COTACAO --> CANCELADA : sem fornecedor / decisão de não repor
    RECEBIDA --> [*]
    CANCELADA --> [*]
```

Regras:

- Transições fora das setas acima são inválidas e devem ser rejeitadas pelo domínio (não pela UI).
- Cancelamento exige observação com o motivo.
- Toda transição gera um `StatusTransition`.

## 4. Papéis e permissões

| Ação | ADMIN | VENDEDOR | COMPRADOR |
|---|---|---|---|
| Login no painel web | sim | sim | sim |
| Registrar falta (WhatsApp/web) | sim | sim | sim |
| Ver fila de faltas completa | sim | somente as próprias | sim |
| Transicionar status (cotação/compra/recebimento) | sim | não | sim |
| Cancelar falta | sim | somente as próprias em REGISTRADA | sim |
| CRUD de usuários | sim | não | não |
| Configurações da loja | sim | não | não |
| Dashboard estratégico | sim | não | visão operacional |

## 5. Conceitos derivados (não são entidades persistidas)

- **Falta recorrente** — mesma peça (`codigo_peca` ou nome normalizado) registrada N vezes numa janela de tempo. Calculada para o dashboard; sinaliza erro de ponto de pedido.
- **Fila do comprador** — projeção das faltas em `REGISTRADA` e `EM_COTACAO`, ordenável por idade, vendedor e recorrência.

## 6. Generalização por segmento

O vocabulário ("peça", "código da peça") é o do segmento autopeças. Na fase de generalização (ver [roadmap](04-roadmap.md)), esses rótulos se tornam configuráveis por loja/segmento; a estrutura (`codigo`, `nome`, `qtd_restante`) permanece a mesma. Nenhuma decisão do MVP deve acoplar regra de negócio ao vocabulário de autopeças.

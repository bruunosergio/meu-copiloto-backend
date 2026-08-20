# Visão do Produto — Meu Copiloto

> Assistente digital de reposição de estoque: substitui o caderno físico de faltas por captura via WhatsApp com interpretação inteligente e um painel web de gestão.

## 1. O problema

Em lojas de varejo — autopeças em particular — o controle de faltas de mercadoria costuma ser feito num **caderno físico**:

- O vendedor percebe que vendeu a última unidade e anota (ou esquece de anotar) a peça no caderno.
- A letra é ilegível, o código vem incompleto, a quantidade não é registrada.
- O comprador precisa decifrar o caderno para montar as cotações com fornecedores.
- Não existe status: ninguém sabe se a peça já foi cotada, comprada ou recebida.
- Não existe histórico: itens que faltam toda semana (erro de ponto de pedido) passam despercebidos.

O resultado é venda perdida, cliente frustrado e compra reativa em vez de estratégica.

## 2. A solução

Um assistente que captura a falta **no momento e no lugar em que ela é percebida**, com o mínimo de fricção possível:

1. O vendedor manda **texto ou áudio no WhatsApp** da loja informando a peça.
2. O sistema **transcreve, interpreta e estrutura** os dados (código da peça, nome, quantidade restante, observação).
3. O sistema devolve um **resumo para confirmação** — nada entra no banco sem o OK do vendedor.
4. A falta entra numa **fila organizada** que o comprador acessa pelo painel web para cotar e comprar.
5. O dono/administrador acompanha um **dashboard estratégico** (recorrência, tempos, volume).

O núcleo do produto é genérico — *captura por mensagem → extração estruturada → confirmação → fila de reposição* — e se aplica a qualquer varejo (mercados, farmácias, materiais de construção). Autopeças é o primeiro segmento e define o vocabulário inicial.

## 3. Personas

| Persona | Quem é | O que precisa |
|---|---|---|
| **Vendedor / Estoquista** | Atende no balcão ou separa peças no estoque. Sempre com pressa, cliente esperando. | Registrar a falta em segundos, por voz ou texto, sem sair do WhatsApp. |
| **Comprador** | Responsável por cotações e compras com fornecedores. Trabalha sentado, com tela grande. | Uma fila de faltas confiável, filtrável e agrupável para montar cotações rapidamente e controlar o status de cada item. |
| **Administrador (dono/gerente)** | Decide o rumo da loja. | Cadastrar usuários, configurar a loja e enxergar métricas que orientem decisões (o que falta sempre, quanto tempo demora a reposição). |

## 4. Caso de uso central

> O vendedor A fecha uma venda e, ao pegar a peça no estoque, percebe que era a **última unidade**. Abre o WhatsApp e manda um áudio: *"acabou o filtro de óleo Fram PH5548, código FR-5548, ficou zero no estoque"*. O sistema transcreve o áudio, extrai `{codigo: FR-5548, nome: Filtro de óleo Fram PH5548, qtd_restante: 0}` e responde com o resumo e os botões **Confirmar / Corrigir**. O vendedor toca em Confirmar. A falta aparece na mesma hora na tela do comprador, com status REGISTRADA, pronta para entrar na próxima cotação.

Fluxos derivados:

- **Texto em vez de áudio** — mesmo pipeline, sem a etapa de transcrição.
- **Correção** — o vendedor toca em Corrigir e reenvia a informação; o registro bruto anterior fica guardado para auditoria.
- **Fallback web** — quem não usar WhatsApp registra a falta por formulário no painel.

## 5. Escopo do MVP

O MVP valida o produto em **uma única loja** (piloto). O modelo de dados já nasce com `store_id` em todas as entidades para não travar o futuro multi-loja, mas sem complexidade operacional de SaaS agora.

**Dentro do escopo:**

- Login com papéis (admin, vendedor, comprador) e painel de administração de usuários.
- Registro de faltas por WhatsApp (texto e áudio) com confirmação, e por formulário web.
- Tela de faltas do comprador com filtros, agrupamento e transições de status.
- Dashboard com as métricas essenciais.

**Fora do escopo (fases futuras):**

- Multi-tenant operacional (onboarding self-service de outras lojas).
- App mobile nativo.
- Integração com ERP/sistema de estoque da loja.
- Cotação automática com fornecedores.

## 6. Métricas de sucesso do piloto

- **Adoção:** % das faltas registradas pelo sistema vs. caderno (meta: caderno abandonado em 4 semanas).
- **Precisão da interpretação:** % de registros confirmados sem correção (meta inicial: > 85%).
- **Tempo de ciclo:** tempo médio entre REGISTRADA e CONCLUIDA, comparado ao processo anterior.
- **Recorrência detectada:** itens identificados como falta recorrente que geraram ajuste de estoque mínimo.

## 7. Documentos relacionados

- [Modelo de domínio](02-modelo-dominio.md)
- [Arquitetura](03-arquitetura.md)
- [Roadmap](04-roadmap.md)
- [Decisões de arquitetura (ADRs)](adr/)

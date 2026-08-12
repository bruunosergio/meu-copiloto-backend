# ADR-0001 — Canal híbrido: WhatsApp para captura, painel web para gestão

**Status:** Aceito (2026-08-04)

## Contexto

O momento crítico do produto é o registro da falta: o vendedor está no balcão ou no estoque, com o cliente esperando. Qualquer fricção (abrir app, login, navegar) faz o funcionário voltar ao caderno físico. Já os fluxos do comprador e do administrador (cotações, cadastro de usuários, dashboard) acontecem sentado, com tempo e tela grande.

Três estratégias foram avaliadas:

1. **App próprio para tudo** — controle total da experiência, mas fricção de instalação/login em celular pessoal, gestão de versões, e a captura por voz precisaria ser construída do zero.
2. **Somente WhatsApp** — captura excelente, mas as telas de gestão (fila do comprador, dashboard, CRUD de usuários) são inviáveis dentro de um chat.
3. **Híbrido** — WhatsApp para captura (onde a fricção mata o produto) e painel web responsivo para gestão (onde tela grande vence).

## Decisão

Adotar o modelo **híbrido**:

- **Vendedor** registra faltas por texto ou áudio no WhatsApp da loja. Formulário web fica disponível como fallback.
- **Comprador e administrador** usam o painel web (login, fila de faltas, dashboard, administração).
- O canal de captura é modelado como **adapter de entrada** da arquitetura hexagonal — o domínio não conhece WhatsApp. Isso mantém aberta a opção de um app nativo como canal alternativo no futuro sem retrabalho no núcleo.

## Alternativas consideradas

- **App próprio para tudo:** descartado para o MVP pela fricção de adoção; reavaliado na fase de generalização para lojas que não queiram WhatsApp.
- **Somente WhatsApp:** descartado porque a tela do comprador é o segundo pilar do produto e exige interface rica.

## Consequências

- Positiva: adoção imediata pelos vendedores (ferramenta que já usam), áudio nativo, nada para instalar.
- Positiva: painel web único para gestão simplifica o desenvolvimento do MVP (sem app store, sem versões).
- Negativa: dependência das políticas e da disponibilidade da plataforma Meta (mitigada pelo ADR-0003 e pelo fallback web).
- Negativa: identificação do vendedor amarrada ao número de telefone cadastrado — exige processo de cadastro rigoroso pelo admin.

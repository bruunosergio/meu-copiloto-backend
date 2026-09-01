# ADR-0007 — Vendedor loga pelo terminal da loja (código+senha) e PIN pessoal, não e-mail+senha

**Status:** Parcialmente substituído por [ADR-0010](0010-login-unico-edicao-e-aviso-similar.md) (2026-08-31)

## Contexto

O uso real na loja piloto expôs um atrito do modelo de login herdado da Fase 1: todo usuário (inclusive VENDEDOR) loga com e-mail+senha, individualmente. No balcão, porém, o computador é compartilhado entre vários vendedores ao longo do turno — pedir e-mail e senha forte a cada troca de vendedor é lento e cria fricção exatamente no momento em que o produto precisa ser mais rápido que o caderno físico que está substituindo.

O padrão consolidado em sistemas de PDV de varejo resolve isso separando dois níveis de sessão: o terminal se autentica uma vez com uma credencial da loja, e cada operador se identifica rapidamente por cima (nome + PIN curto).

Papéis ADMIN e COMPRADOR não têm esse problema — acessam de fora da loja (casa, celular), em dispositivos pessoais, onde e-mail+senha continua sendo o modelo certo.

## Decisão

Dois fluxos de autenticação independentes, por papel:

- **ADMIN e COMPRADOR:** e-mail+senha, de qualquer lugar (inalterado).
- **VENDEDOR:** fluxo de terminal em três passos:
  1. `POST /auth/loja/login` — código+senha da loja (definidos pelo administrador) abrem uma **sessão do terminal**, válida por um turno inteiro (`JWT_EXPIRES_IN_LOJA`, padrão 12h).
  2. `GET /auth/loja/vendedores` — com a sessão do terminal, lista os vendedores ativos da loja (nome, sem credenciais) para exibição em grade.
  3. `POST /auth/loja/vendedor-login` — o vendedor escolhe o próprio nome e confirma com um **PIN de 4 a 6 dígitos**; recebe um token de usuário comum (mesmo formato do login pessoal), mas com expiração curta (`JWT_EXPIRES_IN_VENDEDOR`, padrão 20min — teto de segurança; o painel devolve à lista de nomes após 2min de inatividade, para permitir registrar várias faltas seguidas no mesmo atendimento sem escolher o nome de novo a cada uma).

Mudanças de modelo:

- `Store` ganha `codigo` (identificador de login, distinto do `id` interno) e `senhaHash`.
- `User.email`/`senhaHash` tornam-se opcionais; `User` ganha `usuario` (identificador curto, único por loja) e `pinHash`. Cada papel usa exclusivamente o próprio conjunto de credenciais — VENDEDOR nunca tem e-mail/senha; ADMIN/COMPRADOR nunca têm usuário/PIN. A regra vive em `UserManagementUseCaseImpl`, não no schema.
- O token de sessão do terminal carrega `papel: 'LOJA'`, um valor fora do enum `Role` — o `JwtAuthGuard` rejeita esse token em qualquer rota de negócio; só o `StoreSessionGuard` (usado exclusivamente nas duas rotas do passo 2 e 3 acima) o aceita.

**Vendedores existentes na loja piloto precisam ser recriados** pelo administrador com usuário+PIN após este deploy — não há migração automática de e-mail/senha para usuário/PIN (decisão consciente: simplicidade > migração de poucos registros).

## Alternativas consideradas

- **Manter e-mail+senha para todos:** mais simples de implementar, mas não resolve o atrito real observado no balcão compartilhado.
- **Reaproveitar login de um ADMIN para abrir o terminal:** evitaria criar `Store.codigo`/`senhaHash`, mas mistura uma credencial de alto privilégio (login de administrador) com uma operação de baixo risco (abrir o terminal); também exigiria trocar a senha do admin sempre que a senha do terminal precisasse mudar.
- **PIN sem sessão de loja por cima (vendedor loga direto com usuário+PIN, sem porta de entrada):** mais simples, mas um PIN de 4-6 dígitos é fraco demais para ficar exposto publicamente sem uma segunda camada; a sessão do terminal garante que só quem sabe a senha da loja pode sequer tentar um PIN.

## Consequências

- Positiva: troca de vendedor no balcão vira "tocar no nome + digitar 4 dígitos" — segundos, não login completo.
- Positiva: elimina o atalho de `DEFAULT_STORE_ID` fixo do lado do vendedor mais cedo — o login do terminal já resolve a loja pelo `codigo`, um passo a favor do multi-tenant (ver [docs/05-estrategia-multi-loja.md](../05-estrategia-multi-loja.md)). ADMIN/COMPRADOR ainda dependem do atalho; resolver isso fica para antes da 2ª loja, como já registrado naquele documento.
- Negativa: a senha do terminal é uma credencial compartilhada — se vazar, qualquer pessoa abre a lista de vendedores (mas não age em nome de nenhum, pois toda ação exige o PIN de um vendedor específico). Mitigado por ela nunca aparecer em texto puro (hash bcrypt) e por não dar acesso direto a nenhuma rota de negócio.
- Negativa: PIN de 4-6 dígitos tem espaço de busca pequeno; sem limite de tentativas nesta primeira versão, um ataque de força bruta *contra um vendedor já visível na lista* é tecnicamente possível. Fica registrado como melhoria futura (rate limiting/bloqueio temporário por tentativas erradas) antes de haver muitos vendedores/lojas.
- Negativa: administrador precisa recriar manualmente os vendedores já cadastrados na loja piloto.

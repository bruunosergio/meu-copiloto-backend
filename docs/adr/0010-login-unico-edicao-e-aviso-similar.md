# ADR-0010 — Login único pela loja, edição de falta REGISTRADA e aviso de peça parecida

**Status:** Aceito (2026-08-31)

Substitui parcialmente o [ADR-0007](0007-login-loja-e-pin-vendedor.md): o fluxo do terminal (código+senha da loja → nome → PIN) deixa de ser exclusivo do VENDEDOR. A sessão curta por inatividade continua valendo só para o vendedor no balcão.

## Contexto

O piloto mostrou três atritos no dia a dia:

1. Admin, gerente e comprador também usam o computador da loja. Pedir e-mail+senha para eles, enquanto o vendedor entra com nome+PIN, fragmentava o login e gerava 404 no SPA quando a sessão expirava e o painel mandava para `/login` (rota que a Vercel não reescrevia).
2. Código de peça digitado errado ou duplicado só se descobria depois — o caderno físico já avisava “isso já está na fila”.
3. Corrigir uma falta REGISTRADA exigia cancelar e registrar de novo; cancelar uma falta emprestada deixava o empréstimo PENDENTE órfão.

## Decisão

- **Todo mundo loga pelo terminal da loja** (código+senha → grade de nomes → PIN). A grade lista qualquer usuário ativo com PIN, de qualquer papel.
- **Cadastro exige `usuario`+PIN para todos os papéis.** E-mail+senha passam a ser opcionais (legado e acesso de emergência em `/login`).
- **Só o VENDEDOR** volta à grade após 2 min de inatividade e recebe JWT curto. Admin/gerente/comprador ficam na sessão de 8h.
- **Editar falta** só em `REGISTRADA`, com a mesma permissão do cancelamento (gestor da fila ou o próprio vendedor na falta dele). Pode ligar/desligar empréstimo PENDENTE.
- **Aviso de similar não bloqueia:** código igual (já em UPPERCASE) ou nome parecido (normalização + contém + Levenshtein) em falta `REGISTRADA`/`CONCLUIDA` mostra “já tem na fila… registrar/salvar mesmo assim?”.
- **Cancelar falta apaga o empréstimo PENDENTE** vinculado. Histórico `DEVOLVIDA` permanece.

## Alternativas consideradas

- **Manter e-mail+senha para admin/comprador/gerente:** mais simples no cadastro, mas não resolve o computador compartilhado nem o 404 após JWT expirado.
- **Bloquear registro de peça parecida:** evitaria duplicata, mas no balcão o vendedor às vezes precisa registrar de propósito (outra quantidade, outro cliente, código coincidente). Avisar é o que o caderno fazia.
- **Cancelar empréstimo junto com a falta sem apagar:** deixaria PENDENTE na lista de empréstimos sem falta aberta — lixo operacional.

## Consequências

- Positiva: um único hábito de login no balcão; `/login` vira ponte para contas antigas sem PIN.
- Positiva: correção de digitação sem cancelar; fila e empréstimos ficam consistentes.
- Negativa: usuários já existentes (e-mail+senha, sem PIN) **não aparecem na grade** até o admin entrar pela ponte e cadastrar `usuario`+PIN.
- Negativa: sem unicidade de código de peça no banco — a decisão de duplicar continua humana.

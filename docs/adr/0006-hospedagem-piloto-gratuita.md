# ADR-0006 — Hospedagem do piloto: Neon + Render + Vercel (camada gratuita)

**Status:** Aceito (2026-08-11)

## Contexto

A Fase 1 previa "Deploy em ambiente acessível pela loja piloto" como entrega. Com o núcleo validado (testes unitários e e2e do backend passando, painel web funcional), era hora de decidir onde o sistema roda para uso real da loja piloto no dia a dia — não mais só na máquina de desenvolvimento.

Restrições do dono do produto:

- Precisa ser acessível pela internet (comprador pode cotar de fora da loja).
- Custo zero neste estágio (piloto de uma loja, ainda validando adoção antes de investir em infra paga).
- Sem servidor físico dedicado na loja (evita depender de um PC sempre ligado).

## Decisão

Hospedar cada peça no serviço gratuito mais adequado a ela, todos com deploy automático a partir do GitHub:

- **Frontend (`meu-copiloto-web`):** Vercel. Free tier cobre folgadamente o tráfego de uma loja piloto; HTTPS e domínio `*.vercel.app` automáticos.
- **Backend (`meu-copiloto-backend`):** Render (free web service). Builda via `npm install && npx prisma generate && npm run build`; inicia via `npx prisma migrate deploy && node dist/main.js`, aplicando migrations a cada deploy.
- **Banco de dados:** Neon (Postgres serverless, free tier). Escolhido no lugar do Postgres gratuito do próprio Render porque o deste último expira e é apagado após 90 dias — inviável para dados reais da loja.

## Alternativas consideradas

- **Railway (backend + Postgres integrados):** experiência mais simples (um único provedor), mas o plano gratuito foi descontinuado — hoje é cobrado por uso desde o primeiro dia, o que viola a restrição de custo zero.
- **VPS único (ex.: DigitalOcean/Hetzner) rodando os três serviços via Docker Compose:** mais parecido com produção "de verdade" e sem cold start, mas nenhum provedor sério oferece isso de graça indefinidamente — descartado enquanto o custo zero for requisito.
- **PC da loja na rede local:** custo zero e sem cold start, mas sem acesso remoto (requisito do comprador) e o sistema cai se o PC desligar/reiniciar — descartado.

## Consequências

- Positiva: custo zero, deploy automático a cada `git push`, HTTPS de fábrica nos três serviços.
- Negativa: o free tier do Render "dorme" o backend após ~15 minutos sem tráfego; a primeira requisição depois disso leva ~30-50s (cold start). Mitigável com um ping externo gratuito (ex.: cron-job.org) nos horários de funcionamento da loja, se isso incomodar no uso real.
- Negativa: o free tier do Neon também suspende o banco após inatividade, mas o "wake up" na primeira conexão é rápido (poucos segundos) e não chega a ser perceptível somado ao cold start do Render.
- Esta decisão é explicitamente temporária: quando o piloto validar adoção e/ou entrar a Fase 4 (multi-loja), revisitar com um novo ADR — provavelmente migrando para infra paga com SLA (Railway pago, Render pago, ou um VPS dedicado).

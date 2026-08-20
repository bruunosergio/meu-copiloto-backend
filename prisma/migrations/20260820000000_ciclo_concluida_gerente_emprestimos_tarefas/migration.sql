-- Ciclo de vida simplificado (ADR-0008): EM_COTACAO e COMPRADA sao substituidos
-- por CONCLUIDA. Dados existentes sao remapeados:
--   EM_COTACAO -> REGISTRADA (volta pra fila, a cotacao "em andamento" deixa de existir)
--   COMPRADA   -> CONCLUIDA
-- Tambem: novo papel GERENTE, tabela de emprestimos e quadro de tarefas (sprints/tarefas).

-- 1. Novo papel GERENTE (aditivo, nao usado dentro desta transacao)
ALTER TYPE "Role" ADD VALUE 'GERENTE';

-- 2. Novo enum de status da falta
CREATE TYPE "ShortageStatus_new" AS ENUM ('REGISTRADA', 'CONCLUIDA', 'RECEBIDA', 'CANCELADA');

-- 2a. shortages.status: remapeia valores antigos passando por TEXT
ALTER TABLE "shortages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "shortages" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
UPDATE "shortages" SET "status" = 'REGISTRADA' WHERE "status" = 'EM_COTACAO';
UPDATE "shortages" SET "status" = 'CONCLUIDA' WHERE "status" = 'COMPRADA';
ALTER TABLE "shortages" ALTER COLUMN "status" TYPE "ShortageStatus_new" USING "status"::"ShortageStatus_new";
ALTER TABLE "shortages" ALTER COLUMN "status" SET DEFAULT 'REGISTRADA';

-- 2b. Historico de transicoes: a passagem por EM_COTACAO deixa de existir
-- (REGISTRADA -> EM_COTACAO -> COMPRADA vira uma unica REGISTRADA -> CONCLUIDA)
ALTER TABLE "status_transitions" ALTER COLUMN "de" TYPE TEXT USING "de"::text;
ALTER TABLE "status_transitions" ALTER COLUMN "para" TYPE TEXT USING "para"::text;
DELETE FROM "status_transitions" WHERE "para" = 'EM_COTACAO';
UPDATE "status_transitions" SET "de" = 'REGISTRADA' WHERE "de" = 'EM_COTACAO';
UPDATE "status_transitions" SET "de" = 'CONCLUIDA' WHERE "de" = 'COMPRADA';
UPDATE "status_transitions" SET "para" = 'CONCLUIDA' WHERE "para" = 'COMPRADA';
ALTER TABLE "status_transitions" ALTER COLUMN "de" TYPE "ShortageStatus_new" USING "de"::"ShortageStatus_new";
ALTER TABLE "status_transitions" ALTER COLUMN "para" TYPE "ShortageStatus_new" USING "para"::"ShortageStatus_new";

-- 2c. Troca o tipo antigo pelo novo
DROP TYPE "ShortageStatus";
ALTER TYPE "ShortageStatus_new" RENAME TO "ShortageStatus";

-- 3. Emprestimos de pecas de lojas parceiras
CREATE TYPE "EmprestimoStatus" AS ENUM ('PENDENTE', 'DEVOLVIDA');

CREATE TABLE "emprestimos" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "shortage_id" TEXT NOT NULL,
    "emprestada_de" TEXT,
    "status" "EmprestimoStatus" NOT NULL DEFAULT 'PENDENTE',
    "registrado_por_id" TEXT NOT NULL,
    "devolvido_por_id" TEXT,
    "devolvido_para" TEXT,
    "devolvido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emprestimos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emprestimos_shortage_id_key" ON "emprestimos"("shortage_id");
CREATE INDEX "emprestimos_store_id_status_idx" ON "emprestimos"("store_id", "status");

ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_shortage_id_fkey" FOREIGN KEY ("shortage_id") REFERENCES "shortages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_devolvido_por_id_fkey" FOREIGN KEY ("devolvido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Quadro de tarefas (GERENTE/ADMIN)
CREATE TYPE "TarefaStatus" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA');

CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "inicio" TIMESTAMP(3),
    "fim" TIMESTAMP(3),
    "encerrada" BOOLEAN NOT NULL DEFAULT false,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sprints" ADD CONSTRAINT "sprints_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "sprint_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "TarefaStatus" NOT NULL DEFAULT 'A_FAZER',
    "prazo" TIMESTAMP(3),
    "criado_por_id" TEXT NOT NULL,
    "concluida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tarefas_store_id_sprint_id_idx" ON "tarefas"("store_id", "sprint_id");

ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

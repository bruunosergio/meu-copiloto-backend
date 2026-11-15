-- Cobranca da carteira: snapshot do PDF Shop Control por loja.
-- Acompanhamento (fone/status/promessa/nota) persiste pelo codigo do cliente.

CREATE TYPE "CobrancaStatus" AS ENUM (
    'A_COBRAR',
    'MENSAGEM',
    'PROMETEU',
    'SEM_RESPOSTA',
    'PAGO_PIX',
    'PAGO_CARTAO',
    'PAGO_DINHEIRO',
    'PAGO',
    'NAO_COBRAR'
);

CREATE TYPE "CobrancaAtencao" AS ENUM ('INTERNO', 'PREFEITURA', 'BALCAO');

CREATE TABLE "cobranca_relatorios" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "fonte" TEXT NOT NULL DEFAULT 'Recebíveis em aberto por cliente',
    "clientes" JSONB NOT NULL,
    "importado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importado_por_id" TEXT NOT NULL,

    CONSTRAINT "cobranca_relatorios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cobranca_relatorios_store_id_key" ON "cobranca_relatorios"("store_id");

ALTER TABLE "cobranca_relatorios" ADD CONSTRAINT "cobranca_relatorios_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "cobranca_configs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "ddd_padrao" TEXT NOT NULL DEFAULT '82',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cobranca_configs_store_id_key" ON "cobranca_configs"("store_id");

ALTER TABLE "cobranca_configs" ADD CONSTRAINT "cobranca_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "cobranca_acompanhamentos" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "telefone_override" TEXT,
    "status" "CobrancaStatus" NOT NULL DEFAULT 'A_COBRAR',
    "promessa" TEXT,
    "anotacao" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_acompanhamentos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cobranca_acompanhamentos_store_id_codigo_key" ON "cobranca_acompanhamentos"("store_id", "codigo");

CREATE INDEX "cobranca_acompanhamentos_store_id_idx" ON "cobranca_acompanhamentos"("store_id");

ALTER TABLE "cobranca_acompanhamentos" ADD CONSTRAINT "cobranca_acompanhamentos_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "cobranca_regras" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "tipo" "CobrancaAtencao" NOT NULL,
    "codigo_cliente" TEXT,
    "nome_contem" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cobranca_regras_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cobranca_regras_store_id_idx" ON "cobranca_regras"("store_id");

ALTER TABLE "cobranca_regras" ADD CONSTRAINT "cobranca_regras_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR', 'COMPRADOR');

-- CreateEnum
CREATE TYPE "ShortageStatus" AS ENUM ('REGISTRADA', 'EM_COTACAO', 'COMPRADA', 'RECEBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ShortageOrigin" AS ENUM ('WEB', 'WHATSAPP_AUDIO', 'WHATSAPP_TEXTO');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "segmento" TEXT NOT NULL DEFAULT 'AUTOPECAS',
    "whatsapp_numero" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizada_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone_whatsapp" TEXT,
    "papel" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortages" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "codigo_peca" TEXT,
    "nome_peca" TEXT NOT NULL,
    "qtd_restante" INTEGER NOT NULL,
    "observacao" TEXT,
    "registrado_por_id" TEXT NOT NULL,
    "origem" "ShortageOrigin" NOT NULL DEFAULT 'WEB',
    "status" "ShortageStatus" NOT NULL DEFAULT 'REGISTRADA',
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizada_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shortages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_transitions" (
    "id" TEXT NOT NULL,
    "shortage_id" TEXT NOT NULL,
    "de" "ShortageStatus",
    "para" "ShortageStatus" NOT NULL,
    "executada_por_id" TEXT NOT NULL,
    "motivo" TEXT,
    "ocorrida_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telefone_whatsapp_key" ON "users"("telefone_whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_email_key" ON "users"("store_id", "email");

-- CreateIndex
CREATE INDEX "shortages_store_id_status_idx" ON "shortages"("store_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortages" ADD CONSTRAINT "shortages_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortages" ADD CONSTRAINT "shortages_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_shortage_id_fkey" FOREIGN KEY ("shortage_id") REFERENCES "shortages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_executada_por_id_fkey" FOREIGN KEY ("executada_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

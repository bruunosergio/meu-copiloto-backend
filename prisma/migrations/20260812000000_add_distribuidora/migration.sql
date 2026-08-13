-- CreateTable
CREATE TABLE "distribuidoras" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizada_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribuidoras_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "shortages" ADD COLUMN "distribuidora_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "distribuidoras_store_id_nome_key" ON "distribuidoras"("store_id", "nome");

-- AddForeignKey
ALTER TABLE "distribuidoras" ADD CONSTRAINT "distribuidoras_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortages" ADD CONSTRAINT "shortages_distribuidora_id_fkey" FOREIGN KEY ("distribuidora_id") REFERENCES "distribuidoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

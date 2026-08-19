-- Login da loja (Store.codigo + Store.senhaHash) e PIN do vendedor
-- (User.usuario + User.pinHash) - ver ADR-0007.

-- Store: adiciona codigo (identificador de login do terminal) e senha_hash.
-- codigo comeca nulo, e populado com o id atual (bootstrap seguro para as
-- lojas ja existentes) e so depois vira NOT NULL + UNIQUE.
ALTER TABLE "stores" ADD COLUMN "codigo" TEXT;
UPDATE "stores" SET "codigo" = "id" WHERE "codigo" IS NULL;
ALTER TABLE "stores" ALTER COLUMN "codigo" SET NOT NULL;
ALTER TABLE "stores" ADD COLUMN "senha_hash" TEXT;
CREATE UNIQUE INDEX "stores_codigo_key" ON "stores"("codigo");

-- User: email/senha_hash deixam de ser obrigatorios (VENDEDOR passa a usar
-- usuario+pin_hash em vez de email+senha); usuario e pin_hash sao novos.
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "senha_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "usuario" TEXT;
ALTER TABLE "users" ADD COLUMN "pin_hash" TEXT;
CREATE UNIQUE INDEX "users_store_id_usuario_key" ON "users"("store_id", "usuario");

ALTER TABLE "Order" ADD COLUMN "printfulPayload" JSONB;
ALTER TABLE "Order" ADD COLUMN "printfulResponse" JSONB;
ALTER TABLE "Order" ADD COLUMN "printfulError" TEXT;
ALTER TABLE "Order" ADD COLUMN "printfulSyncedAt" TIMESTAMPTZ;

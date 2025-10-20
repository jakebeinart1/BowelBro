ALTER TABLE "Variant" ADD COLUMN "printfulCatalogVariantId" INTEGER;
ALTER TABLE "Variant" ADD COLUMN "printfulPrintFileUrl" TEXT;
ALTER TABLE "Variant" ADD COLUMN "printfulPrintPlacement" TEXT;
ALTER TABLE "Variant" ADD COLUMN "printfulPrintTechnique" TEXT;
ALTER TABLE "Variant" ADD COLUMN "printfulPrintFiles" JSONB;

/*
  Warnings:

  - Added the required column `month` to the `financial_statements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `financial_statements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add new columns with defaults first
ALTER TABLE "financial_statements" 
ADD COLUMN "cgst" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN "emailed_at" TIMESTAMP(3),
ADD COLUMN "igst" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN "month" INTEGER,
ADD COLUMN "sgst" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN "tds" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN "year" INTEGER;

-- Populate month and year from dateFrom for existing records
UPDATE "financial_statements" 
SET 
  "month" = EXTRACT(MONTH FROM "date_from")::INTEGER,
  "year" = EXTRACT(YEAR FROM "date_from")::INTEGER
WHERE "month" IS NULL OR "year" IS NULL;

-- Now make month and year required
ALTER TABLE "financial_statements"
ALTER COLUMN "month" SET NOT NULL,
ALTER COLUMN "year" SET NOT NULL;

-- CreateIndex
CREATE INDEX "financial_statements_month_idx" ON "financial_statements"("month");

-- CreateIndex
CREATE INDEX "financial_statements_year_idx" ON "financial_statements"("year");

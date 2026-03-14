-- AlterTable
ALTER TABLE "aml_screenings" ADD COLUMN     "flagged_reasons" TEXT,
ADD COLUMN     "match_score" DECIMAL(5,2),
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "screening_results" JSONB;

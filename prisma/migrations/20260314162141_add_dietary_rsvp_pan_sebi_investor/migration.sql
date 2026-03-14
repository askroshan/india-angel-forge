-- AlterTable
ALTER TABLE "event_attendance" ADD COLUMN     "dietary_requirements" TEXT;

-- AlterTable
ALTER TABLE "investor_applications" ADD COLUMN     "pan_number" TEXT,
ADD COLUMN     "sebi_declaration" BOOLEAN NOT NULL DEFAULT false;

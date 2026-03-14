-- CreateEnum
CREATE TYPE "ContentFlagType" AS ENUM ('MESSAGE', 'DISCUSSION', 'REPLY', 'DEAL_COMMUNICATION');

-- CreateEnum
CREATE TYPE "ContentFlagReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'FORWARD_LOOKING_STATEMENT', 'GUARANTEED_RETURNS_CLAIM', 'UNREGISTERED_INVESTMENT_ADVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentFlagStatus" AS ENUM ('PENDING', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ContentFlagResolution" AS ENUM ('REMOVED', 'WARNING_ISSUED', 'USER_SUSPENDED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "SebiAifCategory" AS ENUM ('CATEGORY_I', 'CATEGORY_II', 'CATEGORY_III');

-- CreateEnum
CREATE TYPE "FdiFlagStatus" AS ENUM ('NOT_SCREENED', 'CLEARED', 'FLAGGED', 'UNDER_REVIEW');

-- CreateTable
CREATE TABLE "content_flags" (
    "id" TEXT NOT NULL,
    "content_type" "ContentFlagType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_text" TEXT,
    "flagged_by" TEXT NOT NULL,
    "reason" "ContentFlagReason" NOT NULL,
    "description" TEXT,
    "status" "ContentFlagStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" "ContentFlagResolution",
    "reviewed_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sebi_compliance_checks" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "application_type" TEXT NOT NULL,
    "aif_category" "SebiAifCategory",
    "min_ticket_size_verified" BOOLEAN NOT NULL DEFAULT false,
    "accredited_investor_verified" BOOLEAN NOT NULL DEFAULT false,
    "checked_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sebi_compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fema_fdi_screenings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "application_type" TEXT NOT NULL,
    "sector" TEXT,
    "fdi_cap" DECIMAL(5,2),
    "status" "FdiFlagStatus" NOT NULL DEFAULT 'NOT_SCREENED',
    "rbi_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "screened_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fema_fdi_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpiit_verifications" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "dpiit_certificate_no" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "tax_benefit_eligible" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpiit_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_flags_status_idx" ON "content_flags"("status");

-- CreateIndex
CREATE INDEX "content_flags_flagged_by_idx" ON "content_flags"("flagged_by");

-- CreateIndex
CREATE INDEX "content_flags_content_type_idx" ON "content_flags"("content_type");

-- CreateIndex
CREATE INDEX "content_flags_created_at_idx" ON "content_flags"("created_at");

-- CreateIndex
CREATE INDEX "sebi_compliance_checks_application_id_idx" ON "sebi_compliance_checks"("application_id");

-- CreateIndex
CREATE INDEX "sebi_compliance_checks_application_type_idx" ON "sebi_compliance_checks"("application_type");

-- CreateIndex
CREATE INDEX "fema_fdi_screenings_application_id_idx" ON "fema_fdi_screenings"("application_id");

-- CreateIndex
CREATE INDEX "fema_fdi_screenings_status_idx" ON "fema_fdi_screenings"("status");

-- CreateIndex
CREATE INDEX "dpiit_verifications_application_id_idx" ON "dpiit_verifications"("application_id");

-- CreateIndex
CREATE INDEX "dpiit_verifications_dpiit_certificate_no_idx" ON "dpiit_verifications"("dpiit_certificate_no");

-- AddForeignKey
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sebi_compliance_checks" ADD CONSTRAINT "sebi_compliance_checks_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fema_fdi_screenings" ADD CONSTRAINT "fema_fdi_screenings_screened_by_fkey" FOREIGN KEY ("screened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpiit_verifications" ADD CONSTRAINT "dpiit_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

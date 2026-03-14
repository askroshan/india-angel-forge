-- CreateEnum
CREATE TYPE "DealReferralStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "deal_referrals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "website" TEXT,
    "status" "DealReferralStatus" NOT NULL DEFAULT 'SUBMITTED',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deal_referrals_user_id_idx" ON "deal_referrals"("user_id");

-- CreateIndex
CREATE INDEX "deal_referrals_status_idx" ON "deal_referrals"("status");

-- AddForeignKey
ALTER TABLE "deal_referrals" ADD CONSTRAINT "deal_referrals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

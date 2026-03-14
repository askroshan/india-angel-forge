-- AlterTable
ALTER TABLE "investor_applications" ADD COLUMN     "aum_managed" DECIMAL(20,2),
ADD COLUMN     "bank_account_type" TEXT,
ADD COLUMN     "entity_name" TEXT,
ADD COLUMN     "entity_type" TEXT,
ADD COLUMN     "fcrn_number" TEXT,
ADD COLUMN     "investment_mandate" TEXT,
ADD COLUMN     "is_nri" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kyc_expires_at" TIMESTAMP(3),
ADD COLUMN     "kyc_reminder_sent_at" TIMESTAMP(3),
ADD COLUMN     "num_beneficiaries" INTEGER,
ADD COLUMN     "rbi_compliance_flag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trustee_names" TEXT;

-- CreateTable
CREATE TABLE "family_office_members" (
    "id" TEXT NOT NULL,
    "primary_user_id" TEXT NOT NULL,
    "member_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "family_office_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_office_members_primary_user_id_member_user_id_key" ON "family_office_members"("primary_user_id", "member_user_id");

-- AddForeignKey
ALTER TABLE "family_office_members" ADD CONSTRAINT "family_office_members_primary_user_id_fkey" FOREIGN KEY ("primary_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_office_members" ADD CONSTRAINT "family_office_members_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

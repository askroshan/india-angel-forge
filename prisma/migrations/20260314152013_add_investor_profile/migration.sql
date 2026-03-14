-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sebi_category" TEXT,
    "accreditation_status" TEXT NOT NULL DEFAULT 'PENDING',
    "kyc_status" TEXT NOT NULL DEFAULT 'PENDING',
    "pan_number" TEXT,
    "demat_account_no" TEXT,
    "nri_status" BOOLEAN NOT NULL DEFAULT false,
    "fema_applicable" BOOLEAN NOT NULL DEFAULT false,
    "e_sign_reference" TEXT,
    "nominee_name" TEXT,
    "nominee_relation" TEXT,
    "investment_thesis_url" TEXT,
    "preferred_sectors" TEXT[],
    "tds_deducted_ytd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_user_id_key" ON "investor_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "compliance_filings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "form_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "commitment_id" TEXT,
    "regulatory_ref" TEXT,
    "due_date" TIMESTAMP(3),
    "filed_at" TIMESTAMP(3),
    "filing_reference" TEXT,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_filings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_filings_user_id_form_type_idx" ON "compliance_filings"("user_id", "form_type");

-- CreateIndex
CREATE INDEX "compliance_filings_status_idx" ON "compliance_filings"("status");

-- AddForeignKey
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_filings" ADD CONSTRAINT "compliance_filings_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "investment_commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- US-NEW-001: Lead Capture for Visitors
-- CreateTable
CREATE TABLE "lead_captures" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "interest" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing_page',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_captures_email_key" ON "lead_captures"("email");

-- CreateIndex
CREATE INDEX "lead_captures_email_idx" ON "lead_captures"("email");

-- US-NEW-005: Referral Code System
-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_user_id_key" ON "referral_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "referral_codes"("code");

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "referral_uses" (
    "id" TEXT NOT NULL,
    "referral_code_id" TEXT NOT NULL,
    "referred_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_uses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_uses_referral_code_id_idx" ON "referral_uses"("referral_code_id");

-- AddForeignKey
ALTER TABLE "referral_uses" ADD CONSTRAINT "referral_uses_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- US-NEW-006: QR Token for event attendance
-- AlterTable
ALTER TABLE "event_attendance" ADD COLUMN "qr_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_attendance_qr_token_key" ON "event_attendance"("qr_token");

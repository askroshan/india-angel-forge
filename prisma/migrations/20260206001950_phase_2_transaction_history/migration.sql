-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('CONFIRMED', 'WAITLIST', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('ATTENDED', 'PARTIAL', 'ABSENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'CERTIFICATE_ISSUED';
ALTER TYPE "ActivityType" ADD VALUE 'STATEMENT_GENERATED';
ALTER TYPE "ActivityType" ADD VALUE 'PROFILE_UPDATED';

-- CreateTable
CREATE TABLE "event_attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "rsvp_status" "RsvpStatus" NOT NULL DEFAULT 'CONFIRMED',
    "attendance_status" "AttendanceStatus",
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "certificate_id" TEXT,
    "certificate_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "attendee_name" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "verification_url" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL,
    "statement_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "total_invested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_refunded" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_investment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'detailed',
    "pdf_url" TEXT NOT NULL,
    "emailed_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_attendance_certificate_id_key" ON "event_attendance"("certificate_id");

-- CreateIndex
CREATE INDEX "event_attendance_user_id_idx" ON "event_attendance"("user_id");

-- CreateIndex
CREATE INDEX "event_attendance_event_id_idx" ON "event_attendance"("event_id");

-- CreateIndex
CREATE INDEX "event_attendance_rsvp_status_idx" ON "event_attendance"("rsvp_status");

-- CreateIndex
CREATE INDEX "event_attendance_attendance_status_idx" ON "event_attendance"("attendance_status");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendance_user_id_event_id_key" ON "event_attendance"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");

-- CreateIndex
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");

-- CreateIndex
CREATE INDEX "certificates_event_id_idx" ON "certificates"("event_id");

-- CreateIndex
CREATE INDEX "certificates_certificate_id_idx" ON "certificates"("certificate_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_statement_number_key" ON "financial_statements"("statement_number");

-- CreateIndex
CREATE INDEX "financial_statements_user_id_idx" ON "financial_statements"("user_id");

-- CreateIndex
CREATE INDEX "financial_statements_date_from_idx" ON "financial_statements"("date_from");

-- CreateIndex
CREATE INDEX "financial_statements_date_to_idx" ON "financial_statements"("date_to");

-- CreateIndex
CREATE INDEX "financial_statements_generated_at_idx" ON "financial_statements"("generated_at");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "event_attendance"("certificate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

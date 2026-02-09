-- Phase 2 Database Schema Updates
-- Transaction History & User Experience

-- Add EventAttendance model for tracking RSVPs and check-ins
-- CreateTable
CREATE TABLE "event_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "rsvp_status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "attendance_status" TEXT,
    "check_in_time" TIMESTAMP,
    "check_out_time" TIMESTAMP,
    "certificate_id" TEXT UNIQUE,
    "certificate_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    
    CONSTRAINT "event_attendance_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "event_attendance_event_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "event_attendance_user_id_idx" ON "event_attendance"("user_id");
CREATE INDEX "event_attendance_event_id_idx" ON "event_attendance"("event_id");
CREATE INDEX "event_attendance_rsvp_status_idx" ON "event_attendance"("rsvp_status");
CREATE INDEX "event_attendance_attendance_status_idx" ON "event_attendance"("attendance_status");
CREATE UNIQUE INDEX "event_attendance_user_event_unique" ON "event_attendance"("user_id", "event_id");

-- Add Certificate model for storing event attendance certificates
-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificate_id" TEXT NOT NULL UNIQUE,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "attendee_name" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" TIMESTAMP NOT NULL,
    "duration" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "verification_url" TEXT NOT NULL,
    "issued_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "certificates_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "certificates_event_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");
CREATE INDEX "certificates_event_id_idx" ON "certificates"("event_id");

-- Add FinancialStatement model for user financial reports
-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statement_number" TEXT NOT NULL UNIQUE,
    "user_id" TEXT NOT NULL,
    "date_from" TIMESTAMP NOT NULL,
    "date_to" TIMESTAMP NOT NULL,
    "total_invested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_refunded" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_investment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'detailed',
    "pdf_url" TEXT NOT NULL,
    "emailed_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "financial_statements_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_statement_number_key" ON "financial_statements"("statement_number");
CREATE INDEX "financial_statements_user_id_idx" ON "financial_statements"("user_id");
CREATE INDEX "financial_statements_date_from_idx" ON "financial_statements"("date_from");
CREATE INDEX "financial_statements_date_to_idx" ON "financial_statements"("date_to");

-- Add indexes to existing Payment table for transaction history performance
CREATE INDEX IF NOT EXISTS "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_type_idx" ON "payments"("type");
CREATE INDEX IF NOT EXISTS "payments_gateway_idx" ON "payments"("gateway");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at" DESC);

-- Add indexes to ActivityLog for timeline performance
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_created_at_idx" ON "activity_logs"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "activity_logs_activity_type_idx" ON "activity_logs"("activity_type");
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- Add enums for EventAttendance
-- These are just for reference, Prisma will handle enum creation
-- RsvpStatus: CONFIRMED, WAITLIST, CANCELLED, NO_SHOW
-- AttendanceStatus: ATTENDED, PARTIAL, ABSENT

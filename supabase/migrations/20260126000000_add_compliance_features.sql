-- Migration: Add KYC Documents table and Compliance features
-- Date: 2026-01-26
-- User Stories: US-COMPLIANCE-001, US-COMPLIANCE-002, US-COMPLIANCE-003, US-INVESTOR-002

-- Create KYC Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investor_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('pan', 'aadhaar', 'bank_statement', 'income_proof')),
    file_path TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add compliance_officer role to app_role enum if not exists
DO $$ BEGIN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'compliance_officer';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AML Screening table
CREATE TABLE IF NOT EXISTS aml_screening (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investor_applications(id) ON DELETE CASCADE,
    screening_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    screening_status TEXT NOT NULL DEFAULT 'pending' CHECK (screening_status IN ('pending', 'clear', 'flagged', 'rejected')),
    screening_provider TEXT, -- e.g., 'WorldCheck', 'ComplyAdvantage'
    match_score DECIMAL(5,2), -- 0-100
    screening_results JSONB DEFAULT '{}'::jsonb,
    flagged_reasons TEXT[],
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Accreditation Verification table
CREATE TABLE IF NOT EXISTS accreditation_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investor_applications(id) ON DELETE CASCADE,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('self_certification', 'third_party', 'manual_review')),
    net_worth_verified BOOLEAN DEFAULT FALSE,
    income_verified BOOLEAN DEFAULT FALSE,
    professional_status_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_by UUID REFERENCES auth.users(id),
    verification_documents UUID[], -- Array of document IDs
    notes TEXT,
    expiry_date TIMESTAMPTZ, -- Accreditation may need renewal
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Audit Logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_investor ON kyc_documents(investor_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verified_by ON kyc_documents(verified_by);
CREATE INDEX IF NOT EXISTS idx_aml_screening_investor ON aml_screening(investor_id);
CREATE INDEX IF NOT EXISTS idx_aml_screening_status ON aml_screening(screening_status);
CREATE INDEX IF NOT EXISTS idx_accreditation_investor ON accreditation_verification(investor_id);
CREATE INDEX IF NOT EXISTS idx_accreditation_status ON accreditation_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aml_screening_updated_at BEFORE UPDATE ON aml_screening
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accreditation_verification_updated_at BEFORE UPDATE ON accreditation_verification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE accreditation_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- KYC Documents policies
CREATE POLICY "Investors can view own KYC documents"
    ON kyc_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM investor_applications ia
            WHERE ia.id = kyc_documents.investor_id
            AND ia.user_id = auth.uid()
        )
    );

CREATE POLICY "Investors can insert own KYC documents"
    ON kyc_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM investor_applications ia
            WHERE ia.id = kyc_documents.investor_id
            AND ia.user_id = auth.uid()
        )
    );

CREATE POLICY "Compliance officers can view all KYC documents"
    ON kyc_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

CREATE POLICY "Compliance officers can update KYC documents"
    ON kyc_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

-- AML Screening policies
CREATE POLICY "Only compliance can access AML screening"
    ON aml_screening FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

-- Accreditation Verification policies
CREATE POLICY "Investors can view own accreditation status"
    ON accreditation_verification FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM investor_applications ia
            WHERE ia.id = accreditation_verification.investor_id
            AND ia.user_id = auth.uid()
        )
    );

CREATE POLICY "Compliance can manage accreditation verification"
    ON accreditation_verification FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

-- Audit Logs policies (read-only for admins/compliance)
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Investors can upload own KYC documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'kyc-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT ia.id::text FROM investor_applications ia
            WHERE ia.user_id = auth.uid()
        )
    );

CREATE POLICY "Investors can view own KYC documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'kyc-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT ia.id::text FROM investor_applications ia
            WHERE ia.user_id = auth.uid()
        )
    );

CREATE POLICY "Compliance can view all KYC documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'kyc-documents'
        AND EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'compliance_officer')
        )
    );

-- Create function to send KYC rejection notification
CREATE OR REPLACE FUNCTION send_kyc_rejection_notification(
    p_investor_id UUID,
    p_document_type TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investor RECORD;
    v_result JSONB;
BEGIN
    -- Get investor details
    SELECT ia.email, ia.full_name
    INTO v_investor
    FROM investor_applications ia
    WHERE ia.id = p_investor_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Investor not found');
    END IF;

    -- In production, this would integrate with email service
    -- For now, we'll just return success
    v_result := jsonb_build_object(
        'success', true,
        'email', v_investor.email,
        'name', v_investor.full_name,
        'document_type', p_document_type,
        'reason', p_reason
    );

    RETURN v_result;
END;
$$;

-- Create function to check if investor has completed KYC
CREATE OR REPLACE FUNCTION check_kyc_completion(p_investor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_required_docs TEXT[] := ARRAY['pan', 'aadhaar', 'bank_statement', 'income_proof'];
    v_verified_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT document_type)
    INTO v_verified_count
    FROM kyc_documents
    WHERE investor_id = p_investor_id
    AND verification_status = 'verified'
    AND document_type = ANY(v_required_docs);

    RETURN v_verified_count = array_length(v_required_docs, 1);
END;
$$;

-- Add KYC completion status to investor_applications
ALTER TABLE investor_applications 
ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMPTZ;

-- Create trigger to update KYC completion status
CREATE OR REPLACE FUNCTION update_kyc_completion_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'verified' THEN
        UPDATE investor_applications
        SET 
            kyc_completed = check_kyc_completion(NEW.investor_id),
            kyc_completed_at = CASE 
                WHEN check_kyc_completion(NEW.investor_id) THEN NOW()
                ELSE NULL
            END
        WHERE id = NEW.investor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kyc_completion
    AFTER INSERT OR UPDATE ON kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_kyc_completion_status();

-- Add comments for documentation
COMMENT ON TABLE kyc_documents IS 'Stores KYC documents uploaded by investors for compliance verification';
COMMENT ON TABLE aml_screening IS 'Records AML screening results for investors';
COMMENT ON TABLE accreditation_verification IS 'Tracks accredited investor status verification';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';

COMMENT ON COLUMN kyc_documents.document_type IS 'Type of KYC document: pan, aadhaar, bank_statement, income_proof';
COMMENT ON COLUMN kyc_documents.verification_status IS 'Current verification status: pending, verified, rejected';
COMMENT ON COLUMN aml_screening.screening_status IS 'AML screening result: pending, clear, flagged, rejected';
COMMENT ON COLUMN accreditation_verification.verification_method IS 'How accreditation was verified: self_certification, third_party, manual_review';

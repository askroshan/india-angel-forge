-- Migration: Add Deals and SPV Management
-- Date: 2026-01-27
-- User Stories: US-INVESTOR-003 to US-INVESTOR-010

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    industry_sector TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('Pre-seed', 'Seed', 'Series A', 'Series B+')),
    deal_size BIGINT NOT NULL, -- in paise (₹)
    min_investment BIGINT NOT NULL, -- in paise (₹)
    valuation BIGINT, -- in paise (₹)
    deal_lead TEXT, -- Lead investor name
    deal_status TEXT NOT NULL DEFAULT 'open' CHECK (deal_status IN ('draft', 'open', 'closing_soon', 'closed', 'cancelled')),
    closing_date TIMESTAMPTZ,
    members_only BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    pitch_deck_url TEXT,
    data_room_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deal interests table
CREATE TABLE IF NOT EXISTS deal_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_type TEXT NOT NULL CHECK (interest_type IN ('interested', 'committed', 'withdrawn')),
    commitment_amount BIGINT, -- in paise (₹)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(deal_id, investor_id)
);

-- Create investment commitments table
CREATE TABLE IF NOT EXISTS investment_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commitment_amount BIGINT NOT NULL, -- in paise (₹)
    commitment_status TEXT NOT NULL DEFAULT 'pending' CHECK (commitment_status IN ('pending', 'approved', 'signed', 'funded', 'cancelled')),
    signed_at TIMESTAMPTZ,
    funded_at TIMESTAMPTZ,
    spv_id UUID, -- References spvs table
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create SPVs (Special Purpose Vehicles) table
CREATE TABLE IF NOT EXISTS spvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    lead_investor UUID NOT NULL REFERENCES auth.users(id),
    spv_status TEXT NOT NULL DEFAULT 'forming' CHECK (spv_status IN ('forming', 'open', 'closed', 'investing', 'active', 'dissolved')),
    target_amount BIGINT NOT NULL, -- in paise (₹)
    committed_amount BIGINT DEFAULT 0, -- in paise (₹)
    min_investment BIGINT NOT NULL, -- in paise (₹)
    carry_percentage DECIMAL(5,2), -- e.g., 20.00 for 20%
    management_fee_percentage DECIMAL(5,2), -- e.g., 2.00 for 2%
    description TEXT,
    closing_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create SPV members table
CREATE TABLE IF NOT EXISTS spv_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spv_id UUID NOT NULL REFERENCES spvs(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    membership_status TEXT NOT NULL DEFAULT 'invited' CHECK (membership_status IN ('invited', 'joined', 'declined', 'removed')),
    commitment_amount BIGINT, -- in paise (₹)
    allocation_amount BIGINT, -- in paise (₹)
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(spv_id, investor_id)
);

-- Create deal documents table
CREATE TABLE IF NOT EXISTS deal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('pitch_deck', 'financial_model', 'term_sheet', 'sha', 'other')),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_deals_sector ON deals(industry_sector);
CREATE INDEX IF NOT EXISTS idx_deals_featured ON deals(featured);
CREATE INDEX IF NOT EXISTS idx_deal_interests_deal ON deal_interests(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_interests_investor ON deal_interests(investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_commitments_deal ON investment_commitments(deal_id);
CREATE INDEX IF NOT EXISTS idx_investment_commitments_investor ON investment_commitments(investor_id);
CREATE INDEX IF NOT EXISTS idx_spvs_lead ON spvs(lead_investor);
CREATE INDEX IF NOT EXISTS idx_spvs_status ON spvs(spv_status);
CREATE INDEX IF NOT EXISTS idx_spv_members_spv ON spv_members(spv_id);
CREATE INDEX IF NOT EXISTS idx_spv_members_investor ON spv_members(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_deal ON deal_documents(deal_id);

-- Add updated_at triggers
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_interests_updated_at BEFORE UPDATE ON deal_interests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_commitments_updated_at BEFORE UPDATE ON investment_commitments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spvs_updated_at BEFORE UPDATE ON spvs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spv_members_updated_at BEFORE UPDATE ON spv_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spv_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;

-- Deals policies (members can view, admins can manage)
CREATE POLICY "Members can view published deals"
    ON deals FOR SELECT
    USING (
        deal_status IN ('open', 'closing_soon', 'closed')
        AND (
            NOT members_only OR
            EXISTS (
                SELECT 1 FROM investor_applications ia
                WHERE ia.user_id = auth.uid()
                AND ia.status = 'approved'
            )
        )
    );

CREATE POLICY "Admins can manage all deals"
    ON deals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'moderator')
        )
    );

-- Deal interests policies
CREATE POLICY "Investors can manage own interests"
    ON deal_interests FOR ALL
    USING (investor_id = auth.uid());

CREATE POLICY "Admins can view all interests"
    ON deal_interests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'moderator')
        )
    );

-- Investment commitments policies
CREATE POLICY "Investors can view own commitments"
    ON investment_commitments FOR SELECT
    USING (investor_id = auth.uid());

CREATE POLICY "Investors can create commitments"
    ON investment_commitments FOR INSERT
    WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Admins can manage all commitments"
    ON investment_commitments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin')
        )
    );

-- SPVs policies
CREATE POLICY "Members can view SPVs"
    ON spvs FOR SELECT
    USING (
        spv_status != 'draft' AND
        (
            lead_investor = auth.uid() OR
            EXISTS (
                SELECT 1 FROM spv_members sm
                WHERE sm.spv_id = spvs.id
                AND sm.investor_id = auth.uid()
            )
        )
    );

CREATE POLICY "Lead investors can manage own SPVs"
    ON spvs FOR ALL
    USING (lead_investor = auth.uid());

-- SPV members policies
CREATE POLICY "SPV members can view own membership"
    ON spv_members FOR SELECT
    USING (
        investor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM spvs s
            WHERE s.id = spv_members.spv_id
            AND s.lead_investor = auth.uid()
        )
    );

CREATE POLICY "Lead investors can manage SPV members"
    ON spv_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM spvs s
            WHERE s.id = spv_members.spv_id
            AND s.lead_investor = auth.uid()
        )
    );

-- Deal documents policies
CREATE POLICY "Members can view deal documents"
    ON deal_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_documents.deal_id
            AND (
                NOT d.members_only OR
                EXISTS (
                    SELECT 1 FROM investor_applications ia
                    WHERE ia.user_id = auth.uid()
                    AND ia.status = 'approved'
                )
            )
        )
    );

CREATE POLICY "Admins can manage deal documents"
    ON deal_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'moderator')
        )
    );

-- Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for deal documents
CREATE POLICY "Members can view deal documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'deal-documents'
        AND EXISTS (
            SELECT 1 FROM investor_applications ia
            WHERE ia.user_id = auth.uid()
            AND ia.status = 'approved'
        )
    );

CREATE POLICY "Admins can upload deal documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'deal-documents'
        AND EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'moderator')
        )
    );

-- Function to update SPV committed amount
CREATE OR REPLACE FUNCTION update_spv_committed_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE spvs
        SET committed_amount = (
            SELECT COALESCE(SUM(commitment_amount), 0)
            FROM spv_members
            WHERE spv_id = NEW.spv_id
            AND membership_status = 'joined'
        )
        WHERE id = NEW.spv_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE spvs
        SET committed_amount = (
            SELECT COALESCE(SUM(commitment_amount), 0)
            FROM spv_members
            WHERE spv_id = OLD.spv_id
            AND membership_status = 'joined'
        )
        WHERE id = OLD.spv_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_spv_committed_amount
    AFTER INSERT OR UPDATE OR DELETE ON spv_members
    FOR EACH ROW
    EXECUTE FUNCTION update_spv_committed_amount();

-- Add comments
COMMENT ON TABLE deals IS 'Investment deals/opportunities for angel investors';
COMMENT ON TABLE deal_interests IS 'Investor expressions of interest in deals';
COMMENT ON TABLE investment_commitments IS 'Formal investment commitments from investors';
COMMENT ON TABLE spvs IS 'Special Purpose Vehicles for pooling investments';
COMMENT ON TABLE spv_members IS 'Members/investors in each SPV';
COMMENT ON TABLE deal_documents IS 'Documents associated with deals (pitch decks, term sheets, etc)';

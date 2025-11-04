-- Create founder applications table
CREATE TABLE public.founder_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_website TEXT,
  industry_sector TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Pre-seed', 'Seed', 'Series A')),
  
  -- Founder Information
  founder_name TEXT NOT NULL,
  founder_email TEXT NOT NULL,
  founder_phone TEXT NOT NULL,
  founder_linkedin TEXT,
  co_founders TEXT,
  
  -- Business Details
  founding_date DATE,
  team_size INTEGER,
  location TEXT NOT NULL,
  business_model TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  solution_description TEXT NOT NULL,
  target_market TEXT NOT NULL,
  unique_value_proposition TEXT NOT NULL,
  
  -- Traction & Financials
  current_revenue TEXT,
  monthly_burn_rate TEXT,
  customers_count TEXT,
  key_metrics JSONB,
  
  -- Funding
  previous_funding TEXT,
  amount_raising TEXT NOT NULL,
  use_of_funds TEXT NOT NULL,
  
  -- Additional
  pitch_deck_url TEXT,
  video_pitch_url TEXT,
  referral_source TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'screening', 'forum-selected', 'rejected', 'funded')),
  admin_notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (founder_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (founder_phone ~ '^\+?[0-9\s\-()]{10,}$')
);

-- Create investor applications table
CREATE TABLE public.investor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  linkedin_profile TEXT,
  
  -- Professional Details
  professional_role TEXT NOT NULL,
  company_organization TEXT,
  years_of_experience INTEGER,
  
  -- Investment Profile
  membership_type TEXT NOT NULL CHECK (membership_type IN ('Standard Member', 'Operator Angel', 'Family Office')),
  investment_thesis TEXT NOT NULL,
  preferred_sectors TEXT[] NOT NULL,
  typical_check_size TEXT NOT NULL,
  investment_experience TEXT NOT NULL,
  
  -- Accreditation
  net_worth_range TEXT NOT NULL,
  annual_income_range TEXT NOT NULL,
  previous_angel_investments INTEGER DEFAULT 0,
  portfolio_examples TEXT,
  
  -- References
  reference_name_1 TEXT,
  reference_email_1 TEXT,
  reference_name_2 TEXT,
  reference_email_2 TEXT,
  
  -- Additional
  how_did_you_hear TEXT,
  motivation TEXT NOT NULL,
  
  -- KYC Documents (URLs to uploaded documents)
  pan_document_url TEXT,
  aadhaar_document_url TEXT,
  bank_statement_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under-review', 'kyc-pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_email_investor CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone_investor CHECK (phone ~ '^\+?[0-9\s\-()]{10,}$')
);

-- Enable Row Level Security
ALTER TABLE public.founder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for founder_applications
-- Allow anyone to insert (submit application)
CREATE POLICY "Anyone can submit founder application"
  ON public.founder_applications
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own applications
CREATE POLICY "Users can view own founder applications"
  ON public.founder_applications
  FOR SELECT
  USING (founder_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for investor_applications
-- Allow anyone to insert (submit application)
CREATE POLICY "Anyone can submit investor application"
  ON public.investor_applications
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own applications
CREATE POLICY "Users can view own investor applications"
  ON public.investor_applications
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_founder_applications_updated_at
  BEFORE UPDATE ON public.founder_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investor_applications_updated_at
  BEFORE UPDATE ON public.investor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_founder_applications_email ON public.founder_applications(founder_email);
CREATE INDEX idx_founder_applications_status ON public.founder_applications(status);
CREATE INDEX idx_founder_applications_created_at ON public.founder_applications(created_at DESC);

CREATE INDEX idx_investor_applications_email ON public.investor_applications(email);
CREATE INDEX idx_investor_applications_status ON public.investor_applications(status);
CREATE INDEX idx_investor_applications_created_at ON public.investor_applications(created_at DESC);
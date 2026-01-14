-- Drop policies that use the email column (need to recreate after type change)
DROP POLICY IF EXISTS "Users can view own founder applications" ON public.founder_applications;
DROP POLICY IF EXISTS "Users can view own investor applications" ON public.investor_applications;

-- Add UNIQUE constraints on email columns to prevent duplicate submissions
ALTER TABLE public.founder_applications 
ADD CONSTRAINT founder_applications_email_unique UNIQUE (founder_email);

ALTER TABLE public.investor_applications 
ADD CONSTRAINT investor_applications_email_unique UNIQUE (email);

-- Add length limits using CHECK constraints instead of changing column types
-- This avoids issues with policies while still enforcing limits

-- founder_applications length constraints
ALTER TABLE public.founder_applications
ADD CONSTRAINT founder_company_name_length CHECK (char_length(company_name) <= 100),
ADD CONSTRAINT founder_company_website_length CHECK (char_length(company_website) <= 500),
ADD CONSTRAINT founder_industry_sector_length CHECK (char_length(industry_sector) <= 100),
ADD CONSTRAINT founder_founder_name_length CHECK (char_length(founder_name) <= 100),
ADD CONSTRAINT founder_founder_email_length CHECK (char_length(founder_email) <= 255),
ADD CONSTRAINT founder_founder_phone_length CHECK (char_length(founder_phone) <= 50),
ADD CONSTRAINT founder_founder_linkedin_length CHECK (char_length(founder_linkedin) <= 500),
ADD CONSTRAINT founder_co_founders_length CHECK (char_length(co_founders) <= 1000),
ADD CONSTRAINT founder_location_length CHECK (char_length(location) <= 200),
ADD CONSTRAINT founder_business_model_length CHECK (char_length(business_model) <= 2000),
ADD CONSTRAINT founder_problem_statement_length CHECK (char_length(problem_statement) <= 2000),
ADD CONSTRAINT founder_solution_description_length CHECK (char_length(solution_description) <= 2000),
ADD CONSTRAINT founder_target_market_length CHECK (char_length(target_market) <= 1000),
ADD CONSTRAINT founder_unique_value_proposition_length CHECK (char_length(unique_value_proposition) <= 1000),
ADD CONSTRAINT founder_current_revenue_length CHECK (char_length(current_revenue) <= 200),
ADD CONSTRAINT founder_monthly_burn_rate_length CHECK (char_length(monthly_burn_rate) <= 200),
ADD CONSTRAINT founder_customers_count_length CHECK (char_length(customers_count) <= 200),
ADD CONSTRAINT founder_previous_funding_length CHECK (char_length(previous_funding) <= 1000),
ADD CONSTRAINT founder_amount_raising_length CHECK (char_length(amount_raising) <= 200),
ADD CONSTRAINT founder_use_of_funds_length CHECK (char_length(use_of_funds) <= 2000),
ADD CONSTRAINT founder_pitch_deck_url_length CHECK (char_length(pitch_deck_url) <= 500),
ADD CONSTRAINT founder_video_pitch_url_length CHECK (char_length(video_pitch_url) <= 500),
ADD CONSTRAINT founder_referral_source_length CHECK (char_length(referral_source) <= 500);

-- investor_applications length constraints
ALTER TABLE public.investor_applications
ADD CONSTRAINT investor_full_name_length CHECK (char_length(full_name) <= 100),
ADD CONSTRAINT investor_email_length CHECK (char_length(email) <= 255),
ADD CONSTRAINT investor_phone_length CHECK (char_length(phone) <= 50),
ADD CONSTRAINT investor_linkedin_profile_length CHECK (char_length(linkedin_profile) <= 500),
ADD CONSTRAINT investor_professional_role_length CHECK (char_length(professional_role) <= 200),
ADD CONSTRAINT investor_company_organization_length CHECK (char_length(company_organization) <= 200),
ADD CONSTRAINT investor_membership_type_length CHECK (char_length(membership_type) <= 50),
ADD CONSTRAINT investor_investment_thesis_length CHECK (char_length(investment_thesis) <= 2000),
ADD CONSTRAINT investor_typical_check_size_length CHECK (char_length(typical_check_size) <= 100),
ADD CONSTRAINT investor_investment_experience_length CHECK (char_length(investment_experience) <= 2000),
ADD CONSTRAINT investor_net_worth_range_length CHECK (char_length(net_worth_range) <= 50),
ADD CONSTRAINT investor_annual_income_range_length CHECK (char_length(annual_income_range) <= 50),
ADD CONSTRAINT investor_portfolio_examples_length CHECK (char_length(portfolio_examples) <= 1000),
ADD CONSTRAINT investor_reference_name_1_length CHECK (char_length(reference_name_1) <= 100),
ADD CONSTRAINT investor_reference_email_1_length CHECK (char_length(reference_email_1) <= 255),
ADD CONSTRAINT investor_reference_name_2_length CHECK (char_length(reference_name_2) <= 100),
ADD CONSTRAINT investor_reference_email_2_length CHECK (char_length(reference_email_2) <= 255),
ADD CONSTRAINT investor_how_did_you_hear_length CHECK (char_length(how_did_you_hear) <= 500),
ADD CONSTRAINT investor_motivation_length CHECK (char_length(motivation) <= 2000);

-- Recreate the dropped policies
CREATE POLICY "Users can view own founder applications"
ON public.founder_applications
FOR SELECT
TO authenticated
USING (founder_email = (current_setting('request.jwt.claims', true)::json ->> 'email'));

CREATE POLICY "Users can view own investor applications"
ON public.investor_applications
FOR SELECT
TO authenticated
USING (email = (current_setting('request.jwt.claims', true)::json ->> 'email'));

-- Create rate limiting table to track submissions by IP/fingerprint
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (no policies needed - only accessed via edge functions with service role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create index for efficient rate limit lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (identifier, action, created_at);

-- Create a function to clean old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - interval '1 hour';
END;
$$;
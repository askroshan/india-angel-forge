import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: max 3 submissions per hour per IP
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 60;

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s\-()]{10,}$/;
  return phoneRegex.test(phone) && phone.length <= 50;
}

function validateUrl(url: string | null | undefined): boolean {
  if (!url || url === "") return true;
  try {
    new URL(url);
    return url.length <= 500;
  } catch {
    return false;
  }
}

function validateLength(value: string | null | undefined, min: number, max: number): boolean {
  if (!value) return min === 0;
  return value.length >= min && value.length <= max;
}

interface InvestorApplicationData {
  full_name: string;
  email: string;
  phone: string;
  linkedin_profile?: string | null;
  professional_role: string;
  company_organization?: string | null;
  years_of_experience?: number | null;
  membership_type: string;
  investment_thesis: string;
  preferred_sectors: string[];
  typical_check_size: string;
  investment_experience: string;
  net_worth_range: string;
  annual_income_range: string;
  previous_angel_investments?: number | null;
  portfolio_examples?: string | null;
  reference_name_1?: string | null;
  reference_email_1?: string | null;
  reference_name_2?: string | null;
  reference_email_2?: string | null;
  how_did_you_hear?: string | null;
  motivation: string;
}

function validateInvestorApplication(data: InvestorApplicationData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!validateLength(data.full_name, 2, 100)) {
    errors.push("Full name must be 2-100 characters");
  }
  if (!validateEmail(data.email)) {
    errors.push("Invalid email address");
  }
  if (!validatePhone(data.phone)) {
    errors.push("Invalid phone number");
  }
  if (!validateLength(data.professional_role, 2, 200)) {
    errors.push("Professional role must be 2-200 characters");
  }
  if (!["Standard Member", "Operator Angel", "Family Office"].includes(data.membership_type)) {
    errors.push("Invalid membership type");
  }
  if (!validateLength(data.investment_thesis, 100, 2000)) {
    errors.push("Investment thesis must be 100-2000 characters");
  }
  if (!Array.isArray(data.preferred_sectors) || data.preferred_sectors.length < 1) {
    errors.push("At least one preferred sector is required");
  }
  if (!validateLength(data.typical_check_size, 1, 100)) {
    errors.push("Typical check size is required");
  }
  if (!validateLength(data.investment_experience, 50, 2000)) {
    errors.push("Investment experience must be 50-2000 characters");
  }
  if (!validateLength(data.net_worth_range, 1, 50)) {
    errors.push("Net worth range is required");
  }
  if (!validateLength(data.annual_income_range, 1, 50)) {
    errors.push("Annual income range is required");
  }
  if (!validateLength(data.motivation, 100, 2000)) {
    errors.push("Motivation must be 100-2000 characters");
  }

  // Optional fields with length validation
  if (!validateUrl(data.linkedin_profile)) {
    errors.push("Invalid LinkedIn URL");
  }
  if (data.company_organization && data.company_organization.length > 200) {
    errors.push("Company/organization field too long");
  }
  if (data.portfolio_examples && data.portfolio_examples.length > 1000) {
    errors.push("Portfolio examples field too long");
  }
  if (data.reference_name_1 && data.reference_name_1.length > 100) {
    errors.push("Reference name 1 too long");
  }
  if (data.reference_email_1 && !validateEmail(data.reference_email_1)) {
    errors.push("Invalid reference email 1");
  }
  if (data.reference_name_2 && data.reference_name_2.length > 100) {
    errors.push("Reference name 2 too long");
  }
  if (data.reference_email_2 && !validateEmail(data.reference_email_2)) {
    errors.push("Invalid reference email 2");
  }
  if (data.how_did_you_hear && data.how_did_you_hear.length > 500) {
    errors.push("How did you hear field too long");
  }

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const rateLimitIdentifier = `investor_${clientIP}`;

    console.log(`Investor application submission from IP: ${clientIP}`);

    // Check rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: recentSubmissions } = await supabaseAdmin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("identifier", rateLimitIdentifier)
      .eq("action", "investor_application")
      .gte("created_at", windowStart);

    if (recentSubmissions !== null && recentSubmissions >= RATE_LIMIT_MAX) {
      console.log(`Rate limit exceeded for ${clientIP}: ${recentSubmissions} submissions`);
      return new Response(
        JSON.stringify({ 
          error: "Too many submissions. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW_MINUTES 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60) } 
        }
      );
    }

    // Parse and validate request body
    const data: InvestorApplicationData = await req.json();
    const validation = validateInvestorApplication(data);

    if (!validation.valid) {
      console.log("Validation errors:", validation.errors);
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record rate limit entry
    await supabaseAdmin.from("rate_limits").insert({
      identifier: rateLimitIdentifier,
      action: "investor_application",
    });

    // Clean up old rate limit records periodically (1% chance)
    if (Math.random() < 0.01) {
      await supabaseAdmin.rpc("cleanup_old_rate_limits");
    }

    // Prepare sanitized data for insertion
    const submissionData = {
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      linkedin_profile: data.linkedin_profile?.trim() || null,
      professional_role: data.professional_role.trim(),
      company_organization: data.company_organization?.trim() || null,
      years_of_experience: data.years_of_experience || null,
      membership_type: data.membership_type,
      investment_thesis: data.investment_thesis.trim(),
      preferred_sectors: data.preferred_sectors,
      typical_check_size: data.typical_check_size.trim(),
      investment_experience: data.investment_experience.trim(),
      net_worth_range: data.net_worth_range,
      annual_income_range: data.annual_income_range,
      previous_angel_investments: data.previous_angel_investments || 0,
      portfolio_examples: data.portfolio_examples?.trim() || null,
      reference_name_1: data.reference_name_1?.trim() || null,
      reference_email_1: data.reference_email_1?.trim()?.toLowerCase() || null,
      reference_name_2: data.reference_name_2?.trim() || null,
      reference_email_2: data.reference_email_2?.trim()?.toLowerCase() || null,
      how_did_you_hear: data.how_did_you_hear?.trim() || null,
      motivation: data.motivation.trim(),
    };

    // Insert application
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("investor_applications")
      .insert([submissionData])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      
      // Check for duplicate email
      if (insertError.code === "23505" && insertError.message.includes("email")) {
        return new Response(
          JSON.stringify({ error: "An application with this email already exists" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw insertError;
    }

    console.log("Investor application submitted successfully:", insertedData.id);

    return new Response(
      JSON.stringify({ success: true, id: insertedData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing investor application:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit application. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

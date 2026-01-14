import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: max 3 submissions per hour per IP
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 60;

// Validation schemas (server-side)
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

interface FounderApplicationData {
  company_name: string;
  company_website?: string | null;
  industry_sector: string;
  stage: string;
  founder_name: string;
  founder_email: string;
  founder_phone: string;
  founder_linkedin?: string | null;
  co_founders?: string | null;
  founding_date?: string | null;
  team_size?: number | null;
  location: string;
  business_model: string;
  problem_statement: string;
  solution_description: string;
  target_market: string;
  unique_value_proposition: string;
  current_revenue?: string | null;
  monthly_burn_rate?: string | null;
  customers_count?: string | null;
  previous_funding?: string | null;
  amount_raising: string;
  use_of_funds: string;
  pitch_deck_url?: string | null;
  video_pitch_url?: string | null;
  referral_source?: string | null;
}

function validateFounderApplication(data: FounderApplicationData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields with length validation
  if (!validateLength(data.company_name, 2, 100)) {
    errors.push("Company name must be 2-100 characters");
  }
  if (!validateLength(data.industry_sector, 1, 100)) {
    errors.push("Industry sector is required");
  }
  if (!["Pre-seed", "Seed", "Series A"].includes(data.stage)) {
    errors.push("Invalid funding stage");
  }
  if (!validateLength(data.founder_name, 2, 100)) {
    errors.push("Founder name must be 2-100 characters");
  }
  if (!validateEmail(data.founder_email)) {
    errors.push("Invalid email address");
  }
  if (!validatePhone(data.founder_phone)) {
    errors.push("Invalid phone number");
  }
  if (!validateLength(data.location, 2, 200)) {
    errors.push("Location must be 2-200 characters");
  }
  if (!validateLength(data.business_model, 50, 2000)) {
    errors.push("Business model must be 50-2000 characters");
  }
  if (!validateLength(data.problem_statement, 50, 2000)) {
    errors.push("Problem statement must be 50-2000 characters");
  }
  if (!validateLength(data.solution_description, 50, 2000)) {
    errors.push("Solution description must be 50-2000 characters");
  }
  if (!validateLength(data.target_market, 50, 1000)) {
    errors.push("Target market must be 50-1000 characters");
  }
  if (!validateLength(data.unique_value_proposition, 50, 1000)) {
    errors.push("Unique value proposition must be 50-1000 characters");
  }
  if (!validateLength(data.amount_raising, 1, 200)) {
    errors.push("Amount raising is required");
  }
  if (!validateLength(data.use_of_funds, 100, 2000)) {
    errors.push("Use of funds must be 100-2000 characters");
  }

  // Optional fields with length validation
  if (!validateUrl(data.company_website)) {
    errors.push("Invalid company website URL");
  }
  if (!validateUrl(data.founder_linkedin)) {
    errors.push("Invalid LinkedIn URL");
  }
  if (!validateUrl(data.pitch_deck_url)) {
    errors.push("Invalid pitch deck URL");
  }
  if (!validateUrl(data.video_pitch_url)) {
    errors.push("Invalid video pitch URL");
  }
  if (data.co_founders && data.co_founders.length > 1000) {
    errors.push("Co-founders field too long");
  }
  if (data.current_revenue && data.current_revenue.length > 200) {
    errors.push("Current revenue field too long");
  }
  if (data.monthly_burn_rate && data.monthly_burn_rate.length > 200) {
    errors.push("Monthly burn rate field too long");
  }
  if (data.customers_count && data.customers_count.length > 200) {
    errors.push("Customers count field too long");
  }
  if (data.previous_funding && data.previous_funding.length > 1000) {
    errors.push("Previous funding field too long");
  }
  if (data.referral_source && data.referral_source.length > 500) {
    errors.push("Referral source field too long");
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
    const rateLimitIdentifier = `founder_${clientIP}`;

    console.log(`Founder application submission from IP: ${clientIP}`);

    // Check rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: recentSubmissions } = await supabaseAdmin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("identifier", rateLimitIdentifier)
      .eq("action", "founder_application")
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
    const data: FounderApplicationData = await req.json();
    const validation = validateFounderApplication(data);

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
      action: "founder_application",
    });

    // Clean up old rate limit records periodically (1% chance)
    if (Math.random() < 0.01) {
      await supabaseAdmin.rpc("cleanup_old_rate_limits");
    }

    // Prepare sanitized data for insertion
    const submissionData = {
      company_name: data.company_name.trim(),
      company_website: data.company_website?.trim() || null,
      industry_sector: data.industry_sector.trim(),
      stage: data.stage,
      founder_name: data.founder_name.trim(),
      founder_email: data.founder_email.trim().toLowerCase(),
      founder_phone: data.founder_phone.trim(),
      founder_linkedin: data.founder_linkedin?.trim() || null,
      co_founders: data.co_founders?.trim() || null,
      founding_date: data.founding_date || null,
      team_size: data.team_size || null,
      location: data.location.trim(),
      business_model: data.business_model.trim(),
      problem_statement: data.problem_statement.trim(),
      solution_description: data.solution_description.trim(),
      target_market: data.target_market.trim(),
      unique_value_proposition: data.unique_value_proposition.trim(),
      current_revenue: data.current_revenue?.trim() || null,
      monthly_burn_rate: data.monthly_burn_rate?.trim() || null,
      customers_count: data.customers_count?.trim() || null,
      previous_funding: data.previous_funding?.trim() || null,
      amount_raising: data.amount_raising.trim(),
      use_of_funds: data.use_of_funds.trim(),
      pitch_deck_url: data.pitch_deck_url?.trim() || null,
      video_pitch_url: data.video_pitch_url?.trim() || null,
      referral_source: data.referral_source?.trim() || null,
    };

    // Insert application
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("founder_applications")
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

    console.log("Founder application submitted successfully:", insertedData.id);

    return new Response(
      JSON.stringify({ success: true, id: insertedData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing founder application:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit application. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

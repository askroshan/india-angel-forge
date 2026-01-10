import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const MEMBERSHIP_NAMES: Record<string, string> = {
  standard: "Standard Member",
  operator: "Operator Angel",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[SEND-CONFIRMATION] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logStep("ERROR: Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("ERROR: Invalid authentication token", { error: claimsError });
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = claimsData.claims.email as string;
    logStep("User authenticated", { email: userEmail });

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }
    logStep("Received session ID", { sessionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"],
    });
    logStep("Retrieved Stripe session", { 
      customerEmail: session.customer_email,
      status: session.status,
      membershipType: session.metadata?.membership_type 
    });

    if (session.status !== "complete") {
      throw new Error("Payment not completed");
    }

    const customerEmail = session.customer_email || 
      (session.customer && typeof session.customer === "object" ? session.customer.email : null);
    
    if (!customerEmail) {
      throw new Error("Customer email not found");
    }

    const membershipType = session.metadata?.membership_type || "standard";
    const membershipName = MEMBERSHIP_NAMES[membershipType] || "Standard Member";

    // Send confirmation email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "India Angel Forum <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Welcome to India Angel Forum - ${membershipName} Membership`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin-bottom: 10px;">Welcome to India Angel Forum!</h1>
            <p style="color: #666; font-size: 18px;">Your ${membershipName} membership is now active</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Membership Details</h2>
            <p style="margin: 0; font-size: 16px;"><strong>Plan:</strong> ${membershipName}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Status:</strong> Active</p>
          </div>
          
          <div style="background: #f7f7f7; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="color: #1a365d; margin: 0 0 15px 0;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 10px;">Access our curated deal flow and investment opportunities</li>
              <li style="margin-bottom: 10px;">Join upcoming forum discussions and sector summits</li>
              <li style="margin-bottom: 10px;">Connect with 400+ experienced angel investors</li>
              <li style="margin-bottom: 10px;">Explore our diligence resources and templates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://indiaangelforum.com" style="display: inline-block; background: #1a365d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 14px;">
            <p>Need help? Reply to this email or contact us at hello@indiaangelforum.com</p>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} India Angel Forum. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Email send error", { error: emailError });
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    logStep("Email sent successfully", { emailId: emailData?.id, to: customerEmail });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

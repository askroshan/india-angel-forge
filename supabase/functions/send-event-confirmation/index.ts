import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventConfirmationRequest {
  registrationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-event-confirmation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { registrationId }: EventConfirmationRequest = await req.json();
    console.log("Processing registration:", registrationId);

    if (!registrationId) {
      return new Response(
        JSON.stringify({ error: "Registration ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role client for fetching data
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch registration with event details
    const { data: registration, error: regError } = await serviceClient
      .from("event_registrations")
      .select(`
        *,
        events:event_id (*)
      `)
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      console.error("Registration not found:", regError);
      return new Response(
        JSON.stringify({ error: "Registration not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const event = registration.events;
    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format time
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Registration Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Registration Confirmed! 🎉</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Dear <strong>${registration.full_name}</strong>,</p>
            
            <p>Thank you for registering for our upcoming event. We're excited to have you join us!</p>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #1a365d; margin-top: 0; font-size: 20px;">${event.title}</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 100px;">📅 Date:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">⏰ Time:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">📍 Location:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${event.venue_name || event.location}</td>
                </tr>
                ${event.venue_address ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">🏢 Address:</td>
                  <td style="padding: 8px 0;">${event.venue_address}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>Your Registration Details:</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 14px;">
                Registration ID: <code style="background: white; padding: 2px 6px; border-radius: 4px;">${registration.id.slice(0, 8)}</code>
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              ${event.description}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
              If you have any questions or need to cancel your registration, please don't hesitate to contact us.
            </p>
          </div>
          
          <div style="background: #1a365d; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Chennai Angels. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log("Sending confirmation email to:", registration.email);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Chennai Angels <onboarding@resend.dev>",
      to: [registration.email],
      subject: `Registration Confirmed: ${event.title}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

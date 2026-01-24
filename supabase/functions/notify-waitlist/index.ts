import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyWaitlistRequest {
  eventId: string;
  spotsAvailable?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-waitlist function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, spotsAvailable = 1 }: NotifyWaitlistRequest = await req.json();
    console.log(`Processing waitlist notifications for event ${eventId}, spots: ${spotsAvailable}`);

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "Event ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch event details
    const { data: event, error: eventError } = await serviceClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get next people in waitlist
    const { data: waitlistEntries, error: waitlistError } = await serviceClient
      .from("event_waitlist")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(spotsAvailable);

    if (waitlistError) {
      console.error("Error fetching waitlist:", waitlistError);
      throw waitlistError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log("No one on waitlist");
      return new Response(
        JSON.stringify({ success: true, message: "No one on waitlist", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    let notified = 0;

    for (const entry of waitlistEntries) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Spot Available!</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 A Spot is Now Available!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin-top: 0;">Great news, <strong>${entry.full_name}</strong>!</p>
              
              <p>A spot has opened up for an event you were waiting for!</p>
              
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0; font-size: 20px;">${event.title}</h2>
                
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
                </table>
              </div>
              
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #065f46;"><strong>Act Fast!</strong></p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #047857;">
                  Spots are limited and available on a first-come, first-served basis. Register now before it fills up again!
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
              
              <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                Visit our events page to complete your registration.
              </p>
            </div>
            
            <div style="background: #059669; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #a7f3d0; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} Chennai Angels. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Chennai Angels <onboarding@resend.dev>",
          to: [entry.email],
          subject: `Spot Available: ${event.title}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to notify ${entry.email}:`, emailError);
          continue;
        }

        // Update waitlist entry status
        await serviceClient
          .from("event_waitlist")
          .update({ 
            status: "notified",
            notified_at: new Date().toISOString()
          })
          .eq("id", entry.id);

        notified++;
        console.log(`Notified ${entry.email}`);
      } catch (emailErr: any) {
        console.error(`Error notifying ${entry.email}:`, emailErr);
      }
    }

    console.log(`Completed: ${notified} people notified`);

    return new Response(
      JSON.stringify({ success: true, notified }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-waitlist:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

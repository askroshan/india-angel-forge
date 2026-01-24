import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-event-reminders function called at:", new Date().toISOString());

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get events happening in the next 24-48 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    const dayAfterDate = dayAfterTomorrow.toISOString().split('T')[0];

    console.log(`Looking for events between ${tomorrowDate} and ${dayAfterDate}`);

    // Fetch events happening tomorrow
    const { data: events, error: eventsError } = await serviceClient
      .from("events")
      .select("*")
      .gte("date", tomorrowDate)
      .lt("date", dayAfterDate)
      .in("status", ["upcoming", "ongoing"]);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} events happening tomorrow`);

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No events tomorrow", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const event of events) {
      // Get registrations that haven't received reminders
      const { data: registrations, error: regError } = await serviceClient
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("status", "registered")
        .eq("reminder_sent", false);

      if (regError) {
        console.error(`Error fetching registrations for event ${event.id}:`, regError);
        errors.push(`Event ${event.id}: ${regError.message}`);
        continue;
      }

      console.log(`Found ${registrations?.length || 0} registrations needing reminders for "${event.title}"`);

      if (!registrations || registrations.length === 0) continue;

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

      for (const registration of registrations) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Event Reminder</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Event Tomorrow!</h1>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="margin-top: 0;">Hi <strong>${registration.full_name}</strong>,</p>
                
                <p>This is a friendly reminder that you're registered for an event <strong>tomorrow</strong>!</p>
                
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h2 style="color: #ea580c; margin-top: 0; font-size: 20px;">${event.title}</h2>
                  
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
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; color: #92400e;"><strong>Don't forget!</strong></p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #78350f;">
                    Add this event to your calendar and arrive a few minutes early.
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
                
                <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                  Can't make it anymore? Please cancel your registration so others can attend.
                </p>
              </div>
              
              <div style="background: #ea580c; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
                <p style="color: #fed7aa; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Chennai Angels. All rights reserved.
                </p>
              </div>
            </body>
          </html>
        `;

        try {
          const { error: emailError } = await resend.emails.send({
            from: "Chennai Angels <onboarding@resend.dev>",
            to: [registration.email],
            subject: `Reminder: ${event.title} is Tomorrow!`,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`Failed to send reminder to ${registration.email}:`, emailError);
            errors.push(`Email to ${registration.email}: ${emailError.message}`);
            continue;
          }

          // Mark reminder as sent
          await serviceClient
            .from("event_registrations")
            .update({ reminder_sent: true })
            .eq("id", registration.id);

          emailsSent++;
          console.log(`Sent reminder to ${registration.email}`);
        } catch (emailErr: any) {
          console.error(`Error sending to ${registration.email}:`, emailErr);
          errors.push(`Email to ${registration.email}: ${emailErr.message}`);
        }
      }
    }

    console.log(`Completed: ${emailsSent} reminders sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map price IDs to membership types
const PRICE_TO_MEMBERSHIP: Record<string, string> = {
  "price_1SlFNBPc9OV2pe4RVNjhohQT": "Standard Member",
  "price_1SlFPwPc9OV2pe4RJGcwST9w": "Operator Angel",
};

const sendExpirationWarningEmail = async (
  resend: Resend,
  customerEmail: string,
  customerName: string,
  membershipType: string,
  expirationDate: string
) => {
  logStep("Sending expiration warning email", { customerEmail, membershipType });
  
  await resend.emails.send({
    from: "India Angel Forum <noreply@indiaangelforum.com>",
    to: [customerEmail],
    subject: "Your Membership is Expiring Soon",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #c69c3f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Membership Expiring Soon</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName || "Member"},</p>
              <p>Your <strong>${membershipType}</strong> membership with India Angel Forum is set to expire on <strong>${expirationDate}</strong>.</p>
              <p>To continue enjoying exclusive access to deal flow, events, and our investor community, please renew your membership before it expires.</p>
              <p>Benefits you'll keep with renewal:</p>
              <ul>
                <li>Access to curated startup deal flow</li>
                <li>Invitations to exclusive pitch events</li>
                <li>Networking with fellow angel investors</li>
                <li>SPV participation opportunities</li>
              </ul>
              <a href="https://indiaangelforum.com/membership" class="button">Manage Your Membership</a>
              <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to our team.</p>
              <p>Best regards,<br>The India Angel Forum Team</p>
            </div>
            <div class="footer">
              <p>India Angel Forum | Connecting Angels with India's Best Startups</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
  
  logStep("Expiration warning email sent successfully");
};

const sendCancellationEmail = async (
  resend: Resend,
  customerEmail: string,
  customerName: string,
  membershipType: string
) => {
  logStep("Sending cancellation email", { customerEmail, membershipType });
  
  await resend.emails.send({
    from: "India Angel Forum <noreply@indiaangelforum.com>",
    to: [customerEmail],
    subject: "Your Membership Has Been Cancelled",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #c69c3f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Membership Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName || "Member"},</p>
              <p>We're sorry to see you go. Your <strong>${membershipType}</strong> membership with India Angel Forum has been cancelled.</p>
              <p>We hope you found value in your time with our angel investor community. If you'd like to share any feedback about your experience, we'd love to hear from you.</p>
              <p>Should you wish to rejoin in the future, we'll be here to welcome you back. Your network and connections within our community will always be valued.</p>
              <a href="https://indiaangelforum.com/investors" class="button">Rejoin the Community</a>
              <p style="margin-top: 30px;">Thank you for being part of India Angel Forum.</p>
              <p>Best regards,<br>The India Angel Forum Team</p>
            </div>
            <div class="footer">
              <p>India Angel Forum | Connecting Angels with India's Best Startups</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
  
  logStep("Cancellation email sent successfully");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    if (!stripeKey || !resendKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const resend = new Resend(resendKey);
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    let event: Stripe.Event;
    
    // Enforce webhook signature verification
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature) {
      logStep("ERROR: Missing Stripe signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Processing event", { type: event.type });

    switch (event.type) {
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Check if subscription is set to cancel at period end (expiring soon)
        if (subscription.cancel_at_period_end) {
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const priceId = subscription.items.data[0]?.price.id;
          const membershipType = PRICE_TO_MEMBERSHIP[priceId] || "Member";
          const expirationDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
          
          if (customer.email) {
            await sendExpirationWarningEmail(
              resend,
              customer.email,
              customer.name || "",
              membershipType,
              expirationDate
            );
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const priceId = subscription.items.data[0]?.price.id;
        const membershipType = PRICE_TO_MEMBERSHIP[priceId] || "Member";
        
        if (customer.email) {
          await sendCancellationEmail(
            resend,
            customer.email,
            customer.name || "",
            membershipType
          );
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

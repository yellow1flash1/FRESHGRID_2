import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

interface CheckoutBody {
  amount_paise: number;
  booking_id?: string;
  hub_name: string;
  crates: number;
  days: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY as an edge function secret." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as CheckoutBody;
    if (!body.amount_paise || body.amount_paise < 100) {
      return new Response(
        JSON.stringify({ error: "amount_paise must be a positive integer (min 100 = ₹1.00)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });

    const origin = req.headers.get("origin") || "https://freshgrid.app";
    const description = `FreshGrid cold storage — ${body.crates} crate(s) × ${body.days} day(s) at ${body.hub_name}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Cold-room storage booking",
              description,
            },
            unit_amount: body.amount_paise,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/#/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/payment/cancelled`,
      metadata: {
        booking_id: body.booking_id ?? "",
        hub_name: body.hub_name,
        crates: String(body.crates),
        days: String(body.days),
      },
    });

    // Persist the order row.
    EdgeRuntime.waitUntil(
      supabase.from("orders").insert({
        booking_id: body.booking_id ?? null,
        stripe_session_id: session.id,
        amount_paise: body.amount_paise,
        currency: "inr",
        status: "open",
      }).then(() => {}),
    );

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

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

interface ChatBody {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

interface KB {
  keywords: string[];
  answer: string;
}

const KB: KB[] = [
  {
    keywords: ["hello", "hi", "hey", "namaste"],
    answer:
      "Namaste! I'm the FreshGrid assistant. I can help you scan a crate, find a cold room nearby, book storage, or estimate your income. What would you like to do?",
  },
  {
    keywords: ["scan", "camera", "photo", "grade", "quality"],
    answer:
      "To scan a crate: open the Scan tab, pick your crop, then tap 'Start camera'. Point it at the crate — the app reads colour and dark spots to set ripeness and bruising automatically. You can fine-tune the sliders afterwards, then tap 'Scan crate'. You'll get a quality grade (A/B/C) and estimated shelf life.",
  },
  {
    keywords: ["cold", "room", "storage", "hub", "store", "cold room"],
    answer:
      "Tap the Cold Rooms tab to search real cold-storage facilities near you. Allow location access for nearby results, or type a village/town name. Each hub shows distance, price per crate per day, and free slots. Pick one, enter crates and days, then book — and you can pay for the booking by card.",
  },
  {
    keywords: ["pay", "payment", "card", "upi", "money", "stripe", "checkout"],
    answer:
      "After choosing a cold room you can pay by card through our secure Stripe checkout. The amount is calculated from crates × days × price per crate per day. You'll get a confirmation once the payment succeeds. (If checkout isn't available yet, ask the operator to add the Stripe key.)",
  },
  {
    keywords: ["income", "earn", "profit", "money", "sell", "price", "market"],
    answer:
      "On the My Income tab, enter your harvest in kg and the fair market price per kg. You'll see a side-by-side comparison: without FreshGrid you lose ~38% to spoilage, mandi discounts and full transport; with FreshGrid losses drop to ~8%, transport is ~40% cheaper via pooling, and cold-room + platform fees are already included.",
  },
  {
    keywords: ["grade a", "grade b", "grade c", "spoiled", "spoil", "rot", "shelf life"],
    answer:
      "Grade A (score ≥75, 36 h+): list on the B2B marketplace with a digital quality certificate. Grade B: split into fractional crates and store at the nearest micro-cold hub. Grade C (under 36 h left): flash rescue sale to ketchup, puree and dehydration plants so nothing is wasted.",
  },
  {
    keywords: ["book", "booking", "reserve", "slot"],
    answer:
      "Booking is simple: in the Cold Rooms tab, pick a hub, set crates & days, and confirm. You'll see the total cost upfront, then you can pay by card to lock in the slot.",
  },
  {
    keywords: ["cancel", "refund", "change"],
    answer:
      "You can cancel a booking anytime before pickup. For card payments, refunds are handled through Stripe and usually arrive in 5–10 business days.",
  },
  {
    keywords: ["who", "what is freshgrid", "about", "help"],
    answer:
      "FreshGrid helps farmers scan produce quality, find nearby cold storage, book space, and sell before produce spoils — so less harvest is lost and more money reaches you.",
  },
];

function bestAnswer(msg: string): string {
  const lower = msg.toLowerCase();
  let best: KB | null = null;
  let bestScore = 0;
  for (const entry of KB) {
    const score = entry.keywords.reduce((s, k) => (lower.includes(k) ? s + 1 : s), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.answer;
  return "I'm not sure about that yet, but I can help with scanning a crate, finding a cold room, booking storage, paying for a booking, or estimating your income. Which one would you like?";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ChatBody;
    if (!body.message?.trim()) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const answer = bestAnswer(body.message);

    // Persist the exchange (best-effort).
    EdgeRuntime.waitUntil(
      (async () => {
        await supabase.from("chat_messages").insert([
          { role: "user", content: body.message },
          { role: "assistant", content: answer },
        ]);
      })(),
    );

    return new Response(
      JSON.stringify({ reply: answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

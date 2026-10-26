import { PAY_DETAILS } from "./plans";
import { matchesStripePayment, stripeSessionSchema, type StripeSession } from "./payment-verification";

async function stripeGet(path: string) {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Stripe verification is not connected yet.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Stripe could not verify this payment.");
  return response.json();
}

async function paymentLinkId(): Promise<string> {
  // Only trust the configured link, never a customer-provided merchant/link ID.
  const payload = await stripeGet("payment_links?limit=100");
  const match = payload.data?.find((link: { url: string; id: string }) => link.url === PAY_DETAILS.stripe);
  if (!match?.id) throw new Error("The configured payment link was not found in this Stripe account.");
  return match.id;
}

export async function syncStripeOrder(order: {
  id: string; order_ref: string; email: string; amount_gbp: number | string;
  payment_method: string; status: string; payment_reference: string | null; tier: string;
}) {
  if (order.payment_method !== "stripe" || order.status !== "pending") return;
  if (!process.env["STRIPE_SECRET_KEY"]) return;
  const linkId = await paymentLinkId();
  let sessions: StripeSession[] = [];
  if (order.payment_reference?.startsWith("cs_")) {
    sessions = [stripeSessionSchema.parse(await stripeGet(`checkout/sessions/${encodeURIComponent(order.payment_reference)}`))];
  } else {
    // Match against sessions from this merchant's payment link, not an arbitrary receipt ID.
    const payload = await stripeGet(`checkout/sessions?payment_link=${encodeURIComponent(linkId)}&limit=100`);
    sessions = (payload.data ?? []).flatMap((raw: unknown) => {
      const result = stripeSessionSchema.safeParse(raw);
      return result.success ? [result.data] : [];
    });
  }
  const paid = sessions.find((session) => matchesStripePayment(session, order, linkId));
  if (!paid) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { PRO_KEYS, BASIC_KEYS } = await import("./key-pool.server");
  const { error } = await supabaseAdmin.rpc("fulfill_verified_order", {
    p_id: order.id, p_payment_id: `stripe:${paid.id}`,
    p_keys: order.tier === "pro" ? PRO_KEYS : BASIC_KEYS,
    p_note: "Payment verified with Stripe.",
  });
  if (error) throw new Error("Payment verified but key delivery is temporarily unavailable.");
}

export async function verifyStripeWebhook(body: string, signature: string | null) {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  const parts = signature.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([name]) => name === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const [name, hex] of parts) {
    if (name !== "v1" || !hex || !/^[a-f0-9]{64}$/i.test(hex)) continue;
    const bytes = Uint8Array.from(hex.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16));
    if (await crypto.subtle.verify("HMAC", key, bytes, encoder.encode(`${timestamp}.${body}`))) return true;
  }
  return false;
}
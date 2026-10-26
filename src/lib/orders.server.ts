import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type PaymentMethod, type PlanId } from "./plans";
import { PRO_KEYS, BASIC_KEYS } from "./key-pool.server";
import { initialPaymentStatus } from "./payment-verification";

export type PublicOrder = {
  orderRef: string;
  accessToken?: string;
  plan: PlanId;
  planName: string;
  method: PaymentMethod;
  status: "pending" | "approved" | "rejected";
  key: string | null;
  createdAt: string;
  adminNote: string | null;
};

function randomRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ARC-${stamp}${rand}`;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function nextFreeKey(tier: "pro" | "basic") {
  const db = await admin();
  const pool = tier === "pro" ? PRO_KEYS : BASIC_KEYS;
  const { data } = await db.from("orders").select("redemption_key").eq("tier", tier);
  const used = new Set((data ?? []).map((r) => r.redemption_key).filter(Boolean) as string[]);
  return pool.find((k) => !used.has(k)) ?? null;
}

export async function issueOrder(input: {
  plan: PlanId;
  method: PaymentMethod;
  email: string;
  discord: string;
  reference: string;
  giftcard: string;
}): Promise<{ ok: true; order: PublicOrder } | { ok: false; reason: string }> {
  const db = await admin();
  const plan = PLANS[input.plan];
  if (input.plan !== "basic" && input.method === "bank") {
    return { ok: false, reason: "Bank transfer is currently unavailable. Use PayPal or an Xbox gift card." };
  }
  const isFree = input.plan === "basic";
  const needsReview = !isFree;

  if (!isFree && input.method === "xbox" && input.giftcard.trim().length < 5) {
    return { ok: false, reason: "Enter the full Xbox gift card code." };
  }
  if (!isFree && input.method !== "xbox" && input.method !== "stripe" && input.reference.trim().length < 4) {
    return { ok: false, reason: "Enter your payment reference or transaction ID." };
  }

  let key: string | null = null;
  if (!needsReview) {
    key = await nextFreeKey(plan.tier);
    if (!key) return { ok: false, reason: "All keys for this plan are currently redeemed." };
  }

  const row = {
    order_ref: randomRef(),
    access_token: randomToken(),
    plan: input.plan,
    tier: plan.tier,
    amount_gbp: plan.amount,
    email: input.email.trim().toLowerCase(),
    discord: input.discord.trim() || null,
    payment_method: isFree ? "free" : input.method,
    payment_reference: input.reference.trim() || null,
    giftcard_code: input.method === "xbox" && needsReview ? input.giftcard.trim().toUpperCase() : null,
    status: initialPaymentStatus(input.plan),
    redemption_key: key,
  };

  const { data, error } = await db.from("orders").insert(row).select().single();
  if (error || !data) return { ok: false, reason: error?.message.includes("already submitted") ? "That payment reference or gift card has already been submitted." : "Could not create the order. Try again." };

  return {
    ok: true,
    order: {
      orderRef: data.order_ref,
      accessToken: data.access_token,
      plan: input.plan,
      planName: plan.name,
      method: input.method,
      status: data.status as PublicOrder["status"],
      key: data.redemption_key,
      createdAt: data.created_at,
      adminNote: data.admin_note,
    },
  };
}

export async function readOrder(ref: string, token: string): Promise<PublicOrder | null> {
  const db = await admin();
  let { data } = await db
    .from("orders")
    .select("*")
    .eq("order_ref", ref)
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return null;
  if (data.status === "pending" && data.payment_method === "stripe") {
    const { syncStripeOrder } = await import("./stripe.server");
    try { await syncStripeOrder(data); } catch { /* Keep unverified orders pending; never grant access on provider failure. */ }
    const refreshed = await db.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (refreshed.data) data = refreshed.data;
  }
  return {
    orderRef: data.order_ref,
    plan: data.plan as PlanId,
    planName: PLANS[data.plan as PlanId]?.name ?? data.plan,
    method: data.payment_method as PaymentMethod,
    status: data.status as PublicOrder["status"],
    key: data.status === "approved" ? data.redemption_key : null,
    createdAt: data.created_at,
    adminNote: data.admin_note,
  };
}

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export async function listOrders() {
  const db = await admin();
  if (process.env["STRIPE_SECRET_KEY"]) {
    const { data: pending } = await db.from("orders").select("*").eq("payment_method", "stripe").eq("status", "pending").limit(20);
    const { syncStripeOrder } = await import("./stripe.server");
    await Promise.allSettled((pending ?? []).map(syncStripeOrder));
  }
  const { data } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map((o) => ({
    id: o.id as string,
    orderRef: o.order_ref as string,
    plan: o.plan as string,
    tier: o.tier as string,
    amount: Number(o.amount_gbp),
    email: o.email as string,
    discord: (o.discord as string | null) ?? "",
    method: o.payment_method as string,
    reference: (o.payment_reference as string | null) ?? "",
    giftcard: (o.giftcard_code as string | null) ?? "",
    status: o.status as string,
    key: (o.redemption_key as string | null) ?? "",
    note: (o.admin_note as string | null) ?? "",
    createdAt: o.created_at as string,
  }));
}

export async function updateOrder(input: { id: string; status: "approved" | "rejected"; note: string }) {
  const db = await admin();
  const { data: existing } = await db.from("orders").select("*").eq("id", input.id).maybeSingle();
  if (!existing) return { ok: false as const, reason: "Order not found." };
  if (existing.status !== "pending") return { ok: false as const, reason: "This order has already been processed." };
  if (input.status === "approved") {
    if (existing.payment_method === "stripe") return { ok: false as const, reason: "Stripe orders must be verified with Stripe; manual approval is disabled." };
    if (input.note.trim().length < 10) return { ok: false as const, reason: "Record how you checked the payment before approving." };
    const paymentId = existing.payment_method === "xbox" ? `xbox:${existing.giftcard_code?.replace(/-/g, "").toUpperCase()}` : `${existing.payment_method}:${existing.payment_reference?.toLowerCase()}`;
    const { data, error } = await db.rpc("fulfill_verified_order", {
      p_id: input.id, p_payment_id: paymentId,
      p_keys: existing.tier === "pro" ? PRO_KEYS : BASIC_KEYS, p_note: input.note,
    });
    return !error && data === true ? { ok: true as const } : { ok: false as const, reason: "No unused key is available, or this payment was already used." };
  }

  const { error } = await db
    .from("orders")
    .update({
      status: input.status,
      admin_note: input.note || null,
    })
    .eq("id", input.id).eq("status", "pending");
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}

const RANKS: Record<string, { rank: string; weight: number }> = {
  lifetime: { rank: "AXPlus — Lifetime", weight: 3 },
  monthly: { rank: "AXPlus — Monthly", weight: 2 },
  basic: { rank: "AX Basic", weight: 1 },
};

export async function listMyOrders(email: string) {
  const db = await admin();
  if (process.env["STRIPE_SECRET_KEY"]) {
    const { data: pending } = await db.from("orders").select("*").eq("email", email.trim().toLowerCase()).eq("status", "pending").eq("payment_method", "stripe").limit(20);
    const { syncStripeOrder } = await import("./stripe.server");
    await Promise.allSettled((pending ?? []).map(syncStripeOrder));
  }
  const { data } = await db
    .from("orders")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data ?? []).map((o) => ({
    orderRef: o.order_ref as string,
    accessToken: o.access_token as string,
    plan: o.plan as PlanId,
    planName: PLANS[o.plan as PlanId]?.name ?? (o.plan as string),
    method: o.payment_method as string,
    amount: Number(o.amount_gbp),
    status: o.status as string,
    key: o.status === "approved" ? (o.redemption_key as string | null) ?? null : null,
    note: (o.admin_note as string | null) ?? null,
    createdAt: o.created_at as string,
  }));

  const approved = orders.filter((o) => o.status === "approved");
  let rank = "Plan not selected";
  let weight = 0;
  for (const o of approved) {
    const r = RANKS[o.plan];
    if (r && r.weight > weight) {
      weight = r.weight;
      rank = r.rank;
    }
  }
  const queue = weight >= 2 ? "High" : weight === 1 ? "Low" : "—";
  const dailyUses = weight === 3 ? 5 : weight === 2 ? 3 : weight === 1 ? 1 : 0;
  const accounts = weight === 3 ? 3 : weight === 2 ? 2 : weight === 1 ? 1 : 0;

  return { orders, rank, queue, dailyUses, accounts };
}

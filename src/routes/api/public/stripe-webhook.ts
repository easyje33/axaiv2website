import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    if (Number(request.headers.get("content-length") ?? 0) > 262144) return new Response("Too large", { status: 413 });
    const body = await request.text();
    if (body.length > 262144) return new Response("Too large", { status: 413 });
    const { verifyStripeWebhook, syncStripeOrder } = await import("@/lib/stripe.server");
    if (!await verifyStripeWebhook(body, request.headers.get("stripe-signature"))) return new Response("Invalid signature", { status: 401 });
    let raw: unknown;
    try { raw = JSON.parse(body); } catch { return new Response("Invalid payload", { status: 400 }); }
    const parsed = z.object({ type: z.string(), data: z.object({ object: z.object({ id: z.string().max(200), client_reference_id: z.string().max(60).nullable().optional() }) }) }).safeParse(raw);
    if (!parsed.success) return new Response("Invalid payload", { status: 400 });
    const event = parsed.data;
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) return Response.json({ received: true });
    const ref = event.data.object.client_reference_id;
    if (!ref) return Response.json({ received: true });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("orders").select("*").eq("order_ref", ref).eq("payment_method", "stripe").maybeSingle();
    if (error) return new Response("Temporarily unavailable", { status: 503 });
    if (data) {
      try { await syncStripeOrder({ ...data, payment_reference: event.data.object.id }); }
      catch { return new Response("Verification temporarily unavailable", { status: 503 }); }
    }
    return Response.json({ received: true });
  } } },
});
import { z } from "zod";

export const stripeSessionSchema = z.object({
  id: z.string().regex(/^cs_(?:test_|live_)?[A-Za-z0-9]+$/),
  object: z.literal("checkout.session"),
  status: z.enum(["open", "complete", "expired"]),
  payment_status: z.enum(["paid", "unpaid", "no_payment_required"]),
  amount_total: z.number().int().nullable(),
  currency: z.string().nullable(),
  client_reference_id: z.string().nullable(),
  payment_link: z.string().nullable().optional(),
  customer_details: z.object({ email: z.string().nullable() }).nullable(),
});

export type StripeSession = z.infer<typeof stripeSessionSchema>;

export function matchesStripePayment(session: StripeSession, order: {
  order_ref: string; email: string; amount_gbp: number | string; payment_method: string;
}, paymentLinkId: string) {
  return order.payment_method === "stripe"
    && session.status === "complete"
    && session.payment_status === "paid"
    && session.amount_total === Math.round(Number(order.amount_gbp) * 100)
    && session.currency?.toLowerCase() === "gbp"
    && session.client_reference_id === order.order_ref
    && session.customer_details?.email?.trim().toLowerCase() === order.email.trim().toLowerCase()
    && session.payment_link === paymentLinkId;
}

export function initialPaymentStatus(plan: string): "approved" | "pending" {
  return plan === "basic" ? "approved" : "pending";
}
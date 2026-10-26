export type PlanId = "lifetime" | "monthly" | "basic";
export type PaymentMethod = "paypal" | "bank" | "xbox";

export const PLANS: Record<
  PlanId,
  { name: string; price: string; amount: number; tier: "pro" | "basic"; perks: string[] }
> = {
  lifetime: {
    name: "AXPlus",
    price: "£3.50",
    amount: 3.5,
    tier: "pro",
    perks: ["5 daily uses", "3 accounts saveable", "High queue priority", "One-time, lifetime access"],
  },
  monthly: {
    name: "AXPlus Monthly",
    price: "£3.49 / month",
    amount: 3.49,
    tier: "pro",
    perks: ["3 daily uses", "2 accounts saveable", "High queue priority", "Renews monthly"],
  },
  basic: {
    name: "AX Basic",
    price: "Free",
    amount: 0,
    tier: "basic",
    perks: ["1 daily use", "1 account saveable", "Low queue priority", "Free forever"],
  },
};

export const PAYMENT_METHODS: Record<
  PaymentMethod,
  { name: string; blurb: string; available: boolean }
> = {
  paypal: {
    name: "PayPal",
    blurb: "Send the payment as Friends & Family, then paste your PayPal transaction ID.",
    available: true,
  },
  bank: {
    name: "Bank transfer",
    blurb: "Bank transfer is currently unavailable.",
    available: false,
  },
  xbox: {
    name: "Xbox gift card",
    blurb: "Paste your unused Xbox gift card code. Your key is released once it is verified.",
    available: true,
  },
};

export const PAY_DETAILS = {
  paypal: "sikenukenike@gmail.com",
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "lifetime" || value === "monthly" || value === "basic";
}

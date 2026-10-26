import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createSchema = z.object({
  plan: z.enum(["lifetime", "monthly", "basic"]),
  method: z.enum(["paypal", "bank", "xbox", "stripe"]),
  email: z.string().email().max(200),
  discord: z.string().max(80).optional().default(""),
  reference: z.string().max(200).optional().default(""),
  giftcard: z.string().max(200).optional().default(""),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const { issueOrder } = await import("./orders.server");
    return issueOrder(data);
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ref: z.string().max(60), token: z.string().max(80) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { readOrder } = await import("./orders.server");
    return readOrder(data.ref, data.token);
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, listOrders } = await import("./orders.server");
    await assertAdmin(context.supabase, context.userId);
    return listOrders();
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().max(500).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, updateOrder } = await import("./orders.server");
    await assertAdmin(context.supabase, context.userId);
    return updateOrder(data);
  });

export const myDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMyOrders } = await import("./orders.server");
    const email = (context.claims["email"] as string | undefined) ?? "";
    if (!email) return { email: "", orders: [], rank: "No rank yet", queue: "—", dailyUses: 0, accounts: 0 };
    const result = await listMyOrders(email);
    return { email, ...result };
  });

export const amIAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: data === true };
  });

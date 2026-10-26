import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { lookupOrder } from "@/lib/orders.functions";
import { PAY_DETAILS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order/$ref")({
  validateSearch: (search: Record<string, unknown>): { t: string } => ({
    t: typeof search["t"] === "string" ? search["t"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Your AxAI Order" },
      { name: "description", content: "Track your AxAI order status and collect your redemption key." },
      { property: "og:title", content: "Your AxAI Order" },
      { property: "og:description", content: "Order status and redemption key for AxAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

type Loaded = Awaited<ReturnType<typeof lookupOrder>>;

function OrderPage() {
  const { ref } = Route.useParams();
  const { t } = Route.useSearch();
  const fetchOrder = useServerFn(lookupOrder);
  const [order, setOrder] = useState<Loaded>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await fetchOrder({ data: { ref, token: t } });
        if (active) { setOrder(result); setError(null); }
      } catch { if (active) setError("Could not refresh your order. We’ll try again shortly."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [ref, t, fetchOrder]);

  const copy = async () => {
    if (!order?.key) return;
    await navigator.clipboard.writeText(order.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto max-w-2xl px-5 pt-32 pb-24">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Your order</h1>
          {error && <p role="alert" className="mt-4 text-sm text-muted-foreground">{error}</p>}

          {loading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading order…
            </p>
          )}

          {!loading && !order && (
            <p className="mt-8 text-sm text-muted-foreground">
              We could not find that order. Check the link you were given after checkout.
            </p>
          )}

          {order && (
            <section className="mt-8 space-y-4">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">{order.planName}</h2>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground capitalize">
                    {order.status}
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{order.orderRef}</p>
              </div>

              {order.status === "approved" && order.key && (
                <div className="rounded-3xl border border-border bg-card p-6">
                  <p className="text-xs text-muted-foreground">Redemption key</p>
                  <p className="mt-1 font-mono text-lg break-all tracking-tight">{order.key}</p>
                  <Button
                    type="button"
                    onClick={copy}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy key"}
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Redeem it in the Discord server with /redeem.
                  </p>
                </div>
              )}

              {order.status === "pending" && (
                <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  Your payment is awaiting verification. This page refreshes automatically — your key appears
                  here as soon as it is approved. Keep this link.
                  {order.method === "stripe" && <Button asChild className="mt-4">
                    <a href={`${PAY_DETAILS.stripe}?client_reference_id=${encodeURIComponent(order.orderRef)}`} target="_blank" rel="noreferrer">Pay with Stripe</a>
                  </Button>}
                </div>
              )}

              {order.status === "rejected" && (
                <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  This order was rejected. {order.adminNote || "Contact support in the Discord server."}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { PLANS, PAYMENT_METHODS, PAY_DETAILS, isPlanId, type PaymentMethod, type PlanId } from "@/lib/plans";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { plan: PlanId } => ({
    plan: isPlanId(search["plan"]) ? search["plan"] : "lifetime",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — AxAI Plans" },
      {
        name: "description",
        content:
          "Pay for AXPlus with PayPal, bank transfer or an Xbox gift card, or claim AX Basic free, and get your redemption key.",
      },
      { property: "og:title", content: "Checkout — AxAI Plans" },
      { property: "og:description", content: "PayPal, bank transfer or Xbox gift card. Instant key on approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);
  const details = PLANS[plan];
  const isFree = plan === "basic";

  const [method, setMethod] = useState<PaymentMethod>("paypal");
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [reference, setReference] = useState("");
  const [giftcard, setGiftcard] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await submit({ data: { plan, method, email, discord, reference, giftcard } });
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      navigate({
        to: "/order/$ref",
        params: { ref: result.order.orderRef },
        search: { t: result.order.accessToken ?? "" },
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto max-w-2xl px-5 pt-32 pb-24">
          <Link to="/plans" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
          </Link>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            {isFree ? "Claim AX Basic" : "Checkout"}
          </h1>

          <section className="mt-8 rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">{details.name}</h2>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {details.price}
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {details.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" /> {perk}
                </li>
              ))}
            </ul>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              {!isFree && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Payment method</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        disabled={!PAYMENT_METHODS[id].available}
                        onClick={() => setMethod(id)}
                        className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                          method === id
                            ? "border-foreground bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent"
                        } ${!PAYMENT_METHODS[id].available ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""}`}
                      >
                        {PAYMENT_METHODS[id].name}
                        {!PAYMENT_METHODS[id].available && (
                          <span className="mt-1 block text-[10px] tracking-wide uppercase">Unavailable</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{PAYMENT_METHODS[method].blurb}</p>
                  {method === "paypal" && (
                    <div className="mt-3 rounded-2xl border border-border p-4">
                      <p className="font-mono text-xs break-all">
                        Pay {details.price} to {PAY_DETAILS.paypal}
                      </p>
                      <a
                        href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
                          PAY_DETAILS.paypal,
                        )}&item_name=${encodeURIComponent(details.name)}&amount=${details.amount.toFixed(
                          2,
                        )}&currency_code=GBP&no_shipping=1`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
                      >
                        Pay {details.price} with PayPal
                      </a>
                      <p className="mt-3 text-xs text-muted-foreground">
                        PayPal opens in a new tab. After paying, paste your PayPal transaction ID below to unlock
                        your key.
                      </p>
                    </div>
                  )}
                </div>
              )}


              <label className="block text-xs font-medium text-muted-foreground">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </label>

              <label className="block text-xs font-medium text-muted-foreground">
                Discord username
                <input
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="arcuser"
                  className={field}
                />
              </label>

              {!isFree && method !== "xbox" && (
                <label className="block text-xs font-medium text-muted-foreground">
                  Payment reference / transaction ID
                  <input
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 5AB12345CD678901E"
                    className={field}
                  />
                </label>
              )}

              {!isFree && method === "xbox" && (
                <label className="block text-xs font-medium text-muted-foreground">
                  Xbox gift card code
                  <input
                    required
                    value={giftcard}
                    onChange={(e) => setGiftcard(e.target.value)}
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                    className={`${field} font-mono tracking-tight uppercase`}
                  />
                </label>
              )}

              {error && <p className="text-sm text-muted-foreground">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFree ? "Claim my free key" : method === "xbox" ? "Submit for verification" : "Complete order"}
              </button>

              <p className="text-xs text-muted-foreground">
                {isFree || method !== "xbox"
                  ? "Your key is issued instantly once the order is placed."
                  : "Gift card orders are held until we verify the code, then your key unlocks on the order page."}
              </p>
            </form>
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}

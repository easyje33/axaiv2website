import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { adminListOrders, adminUpdateOrder, amIAdmin } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "AxAI — Admin Orders" },
      { name: "description", content: "Internal AxAI admin panel for tracking orders and verifying gift cards." },
      { property: "og:title", content: "AxAI — Admin Orders" },
      { property: "og:description", content: "Internal order tracking for AxAI." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type OrderRow = Awaited<ReturnType<typeof adminListOrders>>[number];

function AdminPage() {
  const checkAdmin = useServerFn(amIAdmin);
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrder);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const refresh = async () => {
    setBusy(true);
    try {
      setOrders(await list({}));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const result = await checkAdmin({});
      setAllowed(result.admin);
      if (result.admin) await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusy(true);
    try {
      setError(null);
      const result = await update({ data: { id, status, note: notes[id] ?? "" } });
      if (!result.ok) { setError(result.reason); return; }
      await refresh();
    } catch { setError("Could not update the order. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const shown = orders.filter((o) => filter === "all" || o.status === filter);
  const revenue = orders.filter((o) => o.status === "approved").reduce((sum, o) => sum + o.amount, 0);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto max-w-6xl px-5 pt-32 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-tight">Admin</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-accent"
              >
                Sign out
              </button>
            </div>
          </div>

          {allowed === null && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
            </p>
          )}

          {allowed === false && (
            <p className="mt-8 text-sm text-muted-foreground">
              This account is not an admin. <Link to="/" className="underline">Go home</Link>
            </p>
          )}

          {allowed && (
            <>
              {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Stat label="Orders" value={String(orders.length)} />
                <Stat label="Awaiting payment verification" value={String(orders.filter((o) => o.status === "pending").length)} />
                <Stat label="Approved revenue" value={`£${revenue.toFixed(2)}`} />
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-4 py-2 text-xs capitalize transition-colors ${
                      filter === f ? "border-foreground bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {shown.map((o) => (
                  <article key={o.id} className="rounded-3xl border border-border bg-card p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm">{o.orderRef}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString()} · {o.plan} · £{o.amount.toFixed(2)} · {o.method}
                        </p>
                      </div>
                      <span className="rounded-full border border-border px-3 py-1 text-xs capitalize">{o.status}</span>
                    </div>

                    <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                      <Row label="Email" value={o.email} />
                      <Row label="Discord" value={o.discord || "—"} />
                      <Row label="Payment reference" value={o.reference || "—"} />
                      <Row label="Gift card code" value={o.giftcard || "—"} mono />
                      <Row label="Key issued" value={o.key || "—"} mono />
                      <Row label="Note" value={o.note || "—"} />
                    </dl>

                    {o.status === "pending" && (
                      <div className="mt-5 space-y-3">
                        {o.method !== "stripe" && <label className="block text-xs text-muted-foreground">Payment verification note
                          <input aria-label={`Verification note for ${o.orderRef}`} value={notes[o.id] ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [o.id]: event.target.value }))} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground" />
                        </label>}
                        {o.method === "stripe" && <p className="text-xs text-muted-foreground">Awaiting Stripe confirmation. Refresh checks connected payments.</p>}
                        <div className="flex gap-2">
                        {o.method !== "stripe" && <Button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(o.id, "approved")}
                          className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                        >
                          Confirm payment checked &amp; issue key
                        </Button>}
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(o.id, "rejected")}
                          className="rounded-full border border-border px-5 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                        >
                          Reject
                        </Button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {shown.length === 0 && <p className="text-sm text-muted-foreground">No orders here yet.</p>}
              </div>
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono break-all" : "break-all"}>{value}</dd>
    </div>
  );
}

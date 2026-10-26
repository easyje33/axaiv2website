import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { amIAdmin, myDashboard } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AxAI" },
      { name: "description", content: "Track your AxAI orders, verified payments and plan." },
      { property: "og:title", content: "Dashboard — AxAI" },
      { property: "og:description", content: "Your AxAI orders and verified plan status." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const checkAdmin = useServerFn(amIAdmin);
  const navigate = useNavigate();
  const loadDashboard = useServerFn(myDashboard);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof myDashboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const data = await loadDashboard({}); if (active) { setDashboard(data); setError(null); } }
      catch { if (active) setError("Could not load your orders. Try again shortly."); }
    };
    void refresh();
    const interval = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    void checkAdmin({})
      .then((r) => {
        if (active && r.admin) navigate({ to: "/admin", replace: true });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [checkAdmin, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 pb-24">
          <h1 className="fade-up text-4xl font-semibold tracking-tight sm:text-5xl">Your dashboard</h1>
          {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
          {!dashboard && !error && <p className="mt-6 text-sm text-muted-foreground">Loading your orders…</p>}
          {dashboard && <>
            <p className="mt-6 text-lg">{dashboard.rank}</p>
            <p className="mt-2 text-sm text-muted-foreground">{dashboard.email}</p>
            <h2 className="mt-10 text-xl font-semibold">Orders</h2>
            <div className="mt-4 space-y-3">
              {dashboard.orders.map((order) => <article key={order.orderRef} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="font-medium">{order.planName}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">{order.orderRef}</p></div>
                  <span className="text-sm capitalize">{order.status}</span>
                </div>
                <Button asChild variant="outline" className="mt-4"><Link to="/order/$ref" params={{ ref: order.orderRef }} search={{ t: order.accessToken }}>View order</Link></Button>
              </article>)}
              {dashboard.orders.length === 0 && <p className="text-sm text-muted-foreground">No orders for this email yet.</p>}
            </div>
          </>}
          <Button
            type="button"
            onClick={signOut}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </main>
      </div>
    </ThemeProvider>
  );
}

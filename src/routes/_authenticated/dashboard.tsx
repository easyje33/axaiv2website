import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { amIAdmin } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AxAI" },
      { name: "description", content: "Your AxAI dashboard is coming soon." },
      { property: "og:title", content: "Dashboard — AxAI" },
      { property: "og:description", content: "Your AxAI dashboard is coming soon." },
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
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center">
          <h1 className="fade-up text-4xl font-semibold tracking-tight sm:text-5xl">Dashboard coming soon</h1>
          <button
            type="button"
            onClick={signOut}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </main>
      </div>
    </ThemeProvider>
  );
}

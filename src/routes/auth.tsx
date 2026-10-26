import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NotchBar } from "@/components/notch-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin } from "@/lib/orders.functions";

const STAFF_DOMAIN = "@arcai.local";
const toAuthEmail = (value: string) => {
  const v = value.trim();
  return v.includes("@") ? v : `${v.toLowerCase()}${STAFF_DOMAIN}`;
};

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AxAI" },
      { name: "description", content: "Sign in or create an AxAI account to track your purchases, keys and rank status." },
      { property: "og:title", content: "Sign in — AxAI" },
      { property: "og:description", content: "Track your AxAI purchases, keys and rank." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(amIAdmin);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: toAuthEmail(email), password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/dashboard` },
          });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (result.data.session) {
      const staff = await checkAdmin({}).catch(() => ({ admin: false }));
      navigate({ to: staff.admin ? "/admin" : "/dashboard" });
    } else {
      setMessage("Check your email to confirm the account, then sign in.");
    }
  };

  const field =
    "mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto max-w-md px-5 pt-32 pb-24">
          <h1 className="text-4xl font-semibold tracking-tight">Sign in to AxAI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Customers sign in with email. Staff sign in with their username.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-8">
            <label className="block text-xs font-medium text-muted-foreground">
              Email or staff username
              <input required type="text" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Password
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </label>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          </form>
        </main>
      </div>
    </ThemeProvider>
  );
}

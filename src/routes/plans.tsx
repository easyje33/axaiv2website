import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "AXPlus — £3.50 Lifetime | AxAI" },
      { name: "description", content: "AXPlus: 5 daily uses, 3 saveable accounts and high queue priority for a one-time £3.50." },
      { property: "og:title", content: "AXPlus — £3.50 Lifetime | AxAI" },
      { property: "og:description", content: "One plan, one payment, lifetime access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Plans,
});

function Plans() {
  const plan = PLANS.lifetime;
  return (
    <SiteShell>
      <h1 className="fade-up text-center text-4xl font-semibold tracking-tight sm:text-5xl">Plans</h1>
      <p className="fade-up mx-auto mt-4 max-w-md text-center text-sm text-muted-foreground [animation-delay:100ms]">
        One plan. Pay once, keep it forever.
      </p>
      <article className="fade-up mx-auto mt-12 max-w-md rounded-3xl border border-border bg-card p-8 ios-shadow [animation-delay:200ms]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{plan.name}</h2>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Lifetime</span>
        </div>
        <p className="mt-4 text-5xl font-semibold tracking-tight">{plan.price}</p>
        <p className="text-xs text-muted-foreground">One-time payment</p>
        <ul className="mt-6 space-y-3">
          {plan.perks.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/checkout"
          search={{ plan: "lifetime" as const }}
          className="mt-8 block w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
        >
          Buy AXPlus
        </Link>
      </article>
    </SiteShell>
  );
}

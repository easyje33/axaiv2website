import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — AxAI" },
      { name: "description", content: "Answers about AxAI, AXPlus, payments, keys and supported homework platforms." },
      { property: "og:title", content: "FAQ — AxAI" },
      { property: "og:description", content: "Common questions about AxAI and AXPlus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Faq,
});

const faqs = [
  { q: "What is AxAI?", a: "An all-in-one homework autocompleter for Sparx, Educake, Bedrock and Century Tech, run from our Discord server." },
  { q: "How much is AXPlus?", a: "£3.50, paid once. You keep it for life — no subscription." },
  { q: "What do I get with AXPlus?", a: "5 daily uses, 3 saveable accounts and high queue priority." },
  { q: "How can I pay?", a: "PayPal or an Xbox gift card. Bank transfer is currently unavailable." },
  { q: "When do I get my key?", a: "PayPal orders get a key straight away. Xbox gift card orders get a key once the card has been checked." },
  { q: "Where do I see my purchases?", a: "Create an account and open your Dashboard to see your orders, keys and plan." },
];

function Faq() {
  return (
    <SiteShell>
      <h1 className="fade-up text-center text-4xl font-semibold tracking-tight sm:text-5xl">FAQ</h1>
      <div className="mx-auto mt-12 max-w-2xl space-y-3">
        {faqs.map((f, i) => (
          <details
            key={f.q}
            style={{ animationDelay: `${100 + i * 70}ms` }}
            className="fade-up group rounded-3xl border border-border bg-card p-6"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              {f.q}
              <span className="text-muted-foreground transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </SiteShell>
  );
}

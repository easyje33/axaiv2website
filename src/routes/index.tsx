import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AxAI — Homework Autocompleter in One Panel" },
      {
        name: "description",
        content:
          "AxAI completes Sparx Maths, Science, Reader, Educake, Bedrock and Century Tech homework from one panel, run from Discord.",
      },
      { property: "og:title", content: "AxAI — Homework Autocompleter in One Panel" },
      { property: "og:description", content: "One panel for every homework platform. Run it all from Discord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="fade-up inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> All-in-one homework engine
        </span>
        <h1 className="fade-up mt-6 text-5xl leading-[1.05] font-semibold tracking-tight [animation-delay:120ms] sm:text-7xl">
          AxAI finishes
          <br />
          the homework.
        </h1>
        <p className="fade-up mx-auto mt-6 max-w-xl text-base text-muted-foreground [animation-delay:240ms]">
          Sparx Maths, Science and Reader, Educake, Bedrock and Century Tech — completed automatically
          from a single panel, driven straight from our Discord server.
        </p>
        <div className="fade-up mt-9 flex flex-wrap justify-center gap-3 [animation-delay:360ms]">
          <Link
            to="/plans"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            Get AXPlus — £3.50
          </Link>
          <Link
            to="/platforms"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            See platforms
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/discord")({
  head: () => ({
    meta: [
      { title: "Discord — AxAI" },
      { name: "description", content: "Queue homework, watch progress and get completion pings in the AxAI Discord server." },
      { property: "og:title", content: "Discord — AxAI" },
      { property: "og:description", content: "AxAI runs entirely from Discord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Discord,
});

const DISCORD_URL = "https://discord.gg/9ESJAvv7vR";

function Discord() {
  return (
    <SiteShell>
      <section className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="fade-up text-4xl font-semibold tracking-tight sm:text-5xl">It all runs on Discord</h1>
        <p className="fade-up mx-auto mt-4 max-w-lg text-sm text-muted-foreground [animation-delay:120ms]">
          Queue work, watch progress and get completion pings without leaving the server. One command,
          everything done.
        </p>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="fade-up mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95 [animation-delay:240ms]"
        >
          Open server <ArrowUpRight className="h-4 w-4" />
        </a>
      </section>
    </SiteShell>
  );
}

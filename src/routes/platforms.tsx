import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/platforms")({
  head: () => ({
    meta: [
      { title: "Supported Platforms — AxAI" },
      { name: "description", content: "AxAI supports Sparx Maths, Sparx Science, Sparx Reader, Educake, Bedrock and Century Tech." },
      { property: "og:title", content: "Supported Platforms — AxAI" },
      { property: "og:description", content: "Every homework platform AxAI completes, in one panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Platforms,
});

const platforms = [
  { name: "Sparx Maths", detail: "Compulsory, XP Boost and Target tasks solved step by step." },
  { name: "Sparx Science", detail: "Science homework and revision tasks answered end to end." },
  { name: "Sparx Reader", detail: "Reading books cleared with correct comprehension answers." },
  { name: "Educake", detail: "Quiz sets answered and submitted with human-like pacing." },
  { name: "Bedrock", detail: "Vocabulary and grammar blocks cleared block by block." },
  { name: "Century Tech", detail: "Nuggets completed with adaptive path handling." },
];

function Platforms() {
  return (
    <SiteShell>
      <h1 className="fade-up text-center text-4xl font-semibold tracking-tight sm:text-5xl">Platforms</h1>
      <p className="fade-up mx-auto mt-4 max-w-md text-center text-sm text-muted-foreground [animation-delay:100ms]">
        Six platforms, one panel.
      </p>
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {platforms.map((p, i) => (
          <article
            key={p.name}
            style={{ animationDelay: `${150 + i * 80}ms` }}
            className="fade-up rounded-3xl border border-border bg-card p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.detail}</p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}

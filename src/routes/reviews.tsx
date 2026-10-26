import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — AxAI" },
      { name: "description", content: "Read what people say about AxAI and leave your own star review." },
      { property: "og:title", content: "Reviews — AxAI" },
      { property: "og:description", content: "Star ratings and reviews from AxAI users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reviews,
});

type Review = { id: string; user_id: string; name: string; rating: number; message: string; created_at: string };

// The reviews table may not be in the generated types yet, so query it untyped.
const reviewsTable = () => (supabase as unknown as { from: (t: string) => any }).from("reviews");

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={onChange ? "transition-transform active:scale-90" : "cursor-default"}
        >
          <Star className={`h-5 w-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await reviewsTable().select("*").order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId) return;
    if (!name.trim() || !message.trim()) return setError("Please add your name and a message.");
    setSaving(true);
    const { error: err } = await reviewsTable().insert({
      user_id: userId,
      name: name.trim().slice(0, 60),
      rating,
      message: message.trim().slice(0, 1000),
    });
    setSaving(false);
    if (err) return setError("Couldn't post your review. Please try again.");
    setName("");
    setMessage("");
    setRating(5);
    void load();
  };

  const remove = async (id: string) => {
    await reviewsTable().delete().eq("id", id);
    void load();
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <SiteShell>
      <h1 className="fade-up text-center text-4xl font-semibold tracking-tight sm:text-5xl">Reviews</h1>
      {reviews.length > 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {avg.toFixed(1)} out of 5 · {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mx-auto mt-12 max-w-2xl">
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-semibold tracking-tight">Leave a review</h2>
          {userId ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <Stars value={rating} onChange={setRating} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="What did you think?"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Post review
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              <Link to="/auth" className="underline">Sign in</Link> to leave a review.
            </p>
          )}
        </section>

        <div className="mt-8 space-y-3">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </p>
          )}
          {!loading && reviews.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No reviews yet. Be the first!</p>
          )}
          {reviews.map((r) => (
            <article key={r.id} className="fade-up rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  {r.user_id === userId && (
                    <button type="button" onClick={() => remove(r.id)} aria-label="Delete review" className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{r.message}</p>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}

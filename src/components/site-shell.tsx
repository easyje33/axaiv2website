import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { NotchBar } from "./notch-bar";
import { ThemeProvider } from "./theme-provider";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <NotchBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-32 pb-24">{children}</main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-glow relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-6xl px-5">
        <p
          aria-hidden="true"
          className="footer-wordmark reveal-up pointer-events-none select-none text-center font-semibold leading-[0.8] tracking-tighter"
        >
          axai
        </p>
        <div className="flex items-center justify-between border-t border-border py-6 text-xs text-muted-foreground">
          <span>© 2026 AxAI</span>
          <div className="flex gap-4">
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/plans" className="hover:text-foreground">Plans</Link>
            <Link to="/reviews" className="hover:text-foreground">Reviews</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Moon, Sun, Signal, Wifi, BatteryFull } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "./theme-provider";

const links = [
  { label: "Home", to: "/" },
  { label: "Platforms", to: "/platforms" },
  { label: "Plans", to: "/plans" },
  { label: "Discord", to: "/discord" },
  { label: "FAQ", to: "/faq" },
  { label: "Reviews", to: "/reviews" },
  { label: "Dashboard", to: "/dashboard" },
] as const;

export function NotchBar() {
  const { theme, toggle } = useTheme();
  const [time, setTime] = useState("");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 10000);
    const onScroll = () => setCompact(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <nav
        className={`glass-panel ios-shadow flex items-center justify-between gap-3 rounded-full transition-all duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)] ${
          compact ? "w-[min(100%,26rem)] py-1.5 pr-1.5 pl-4" : "w-full max-w-4xl py-2 pr-2 pl-5"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            AxAI
          </Link>
          <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">{time}</span>
        </div>

        <div
          className={`items-center gap-5 text-xs font-medium text-muted-foreground transition-opacity duration-300 ${
            compact ? "hidden" : "hidden md:flex"
          }`}
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground" }}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <BatteryFull className="h-3.5 w-3.5" />
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle night and light mode"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {/* mobile nav row */}
      <div className={`fixed inset-x-0 bottom-4 z-50 flex justify-center md:hidden ${compact ? "" : ""}`}>
        <div className="glass-panel ios-shadow flex gap-4 rounded-full px-5 py-2.5 text-xs font-medium text-muted-foreground">
          {links.slice(0, 5).map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

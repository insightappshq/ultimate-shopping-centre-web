"use client";

import { ClockIcon, SearchIcon, TrendingUpIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { popularSearches } from "@/config/site";
import { searchHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const RECENT_KEY = "usc:recent-searches";
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const next = [query, ...readRecent().filter((q) => q.toLowerCase() !== query.toLowerCase())];
  localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
}

export function SearchBar({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);

  // Keep the box in sync when navigating between searches.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  const suggestions = (() => {
    const q = query.trim().toLowerCase();
    const fromRecent = recent.filter((r) => !q || r.toLowerCase().includes(q)).map((value) => ({ value, recent: true }));
    const fromPopular = popularSearches
      .filter((p) => (!q || p.toLowerCase().includes(q)) && !recent.some((r) => r.toLowerCase() === p.toLowerCase()))
      .map((value) => ({ value, recent: false }));
    return [...fromRecent, ...fromPopular].slice(0, 8);
  })();

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return inputRef.current?.focus();
    saveRecent(q);
    setOpen(false);
    inputRef.current?.blur();
    router.push(searchHref(q));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      submit(suggestions[active].value);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(event) => {
        event.preventDefault();
        submit(query);
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={query}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Search for atta, milk, butter, detergent…"
        aria-label="Search products across platforms"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => {
          setRecent(readRecent());
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-xl border border-input bg-card pr-28 pl-10 text-sm shadow-card outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-[5.5rem] -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
      <button
        type="submit"
        className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Search
      </button>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-elevated"
        >
          {suggestions.map((s, index) => (
            <li
              key={`${s.recent}-${s.value}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                submit(s.value);
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                index === active && "bg-accent",
              )}
            >
              {s.recent ? (
                <ClockIcon className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <TrendingUpIcon className="size-4 text-muted-foreground" aria-hidden />
              )}
              <span className="flex-1 truncate capitalize">{s.value}</span>
              <span className="text-[0.68rem] text-muted-foreground">{s.recent ? "Recent" : "Popular"}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

export function SearchBarFallback({ className }: { className?: string }) {
  return <div className={cn("h-11 w-full rounded-xl border bg-card shadow-card", className)} />;
}

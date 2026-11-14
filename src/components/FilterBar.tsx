"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type FilterCategory = { slug: string; name: string; accent: string };

const SORTS = [
  { id: "trending", label: "Trending" },
  { id: "popular", label: "Most played" },
  { id: "new", label: "Newest" },
  { id: "rating", label: "Top rated" },
  { id: "top", label: "High scores" },
];

export function FilterBar({ categories }: { categories: FilterCategory[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/explore?${next.toString()}`);
    },
    [params, router]
  );

  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "trending";

  return (
    <div className="plate grain p-5">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="relative min-w-[240px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim() || null);
          }}
        >
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, tagline or description…"
            className="field"
            style={{ paddingLeft: 38 }}
            aria-label="Search games"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} style={{ color: "var(--muted-2)" }} />
          {SORTS.map((s) => (
            <button key={s.id} className="chip" data-active={sort === s.id} onClick={() => setParam("sort", s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="chip" data-active={!category} onClick={() => setParam("category", null)}>
          All games
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            className="chip"
            data-active={category === c.slug}
            onClick={() => setParam("category", category === c.slug ? null : c.slug)}
          >
            {category === c.slug && <X size={11} />}
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

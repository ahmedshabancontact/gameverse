import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Action, adventure, racing, shooting, sports, puzzle, strategy, multiplayer, arcade, voxel, horror, simulator, platformer and classic games.",
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// Genre index</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,64px)" }}>
        Categories
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Fourteen shelves, each stocked with original browser games. Pick a genre and the cabinet does the rest.
      </p>

      <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="plate grain group relative overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1.5"
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-45"
              style={{ background: c.accent }}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="micro" style={{ color: c.accent }}>
                  Shelf {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="display mt-2 text-2xl">{c.name}</h2>
                <p className="mt-2.5 max-w-[34ch] text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {c.description}
                </p>
              </div>
              <span
                className="tabnum shrink-0 rounded px-2.5 py-1.5 text-[12px]"
                style={{ background: `color-mix(in srgb, ${c.accent} 18%, transparent)`, color: c.accent }}
              >
                {c.count}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[12px]">
              <span className="micro" style={{ color: c.accent }}>
                Open shelf
              </span>
              <ArrowRight size={14} style={{ color: c.accent }} className="transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(100, c.count * 12)}%`, background: c.accent }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

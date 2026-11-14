import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EmptyState, GameCard } from "@/components/GameCard";
import { getCategoryBySlug, getGames } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat ? `${cat.name} games` : "Category", description: cat?.description };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const games = await getGames({ category: slug, limit: 60 });

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <Link href="/categories" className="micro flex items-center gap-1.5 transition-colors hover:text-[color:var(--violet-hi)]">
        <ChevronLeft size={13} /> All categories
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="micro" style={{ color: cat.accent }}>
            // Shelf · {cat.slug}
          </p>
          <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,64px)" }}>
            {cat.name}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px]" style={{ color: "var(--muted)" }}>
            {cat.description}
          </p>
        </div>
        <div
          className="rounded px-5 py-4"
          style={{ background: `color-mix(in srgb, ${cat.accent} 16%, transparent)`, border: `1px solid ${cat.accent}44` }}
        >
          <p className="micro">Cabinets on this shelf</p>
          <p className="tabnum mt-1 text-[32px] leading-none" style={{ color: cat.accent }}>
            {games.length}
          </p>
        </div>
      </div>

      <div className="mt-10">
        {games.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {games.map((g) => (
              <div key={g.id} className="w-full">
                <GameCard game={g} size="lg" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Shelf is empty" body="No games have been filed under this category yet." />
        )}
      </div>
    </div>
  );
}

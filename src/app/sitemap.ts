import type { MetadataRoute } from "next";
import { getGames } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://gameverse.gg";
  const games = await getGames({ limit: 100 });
  const staticRoutes = ["", "/explore", "/categories", "/trending", "/multiplayer", "/leaderboard", "/login", "/signup"].map(
    (p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })
  );
  const gameRoutes = games.map((g) => ({
    url: `${base}/games/${g.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [...staticRoutes, ...gameRoutes];
}

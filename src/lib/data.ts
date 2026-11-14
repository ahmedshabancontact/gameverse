import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  achievements,
  categories,
  dailyChallenges,
  favorites,
  games,
  plays,
  reviews,
  userAchievements,
  users,
} from "@/db/schema";

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export type GameRow = typeof games.$inferSelect & { categoryName?: string; categorySlug?: string; categoryAccent?: string };

export async function getGames(
  opts: {
    q?: string;
    category?: string;
    sort?: "trending" | "popular" | "new" | "rating" | "top";
    limit?: number;
    featured?: boolean;
    players?: string;
    ids?: number[];
    activeOnly?: boolean;
  } = {}
): Promise<GameRow[]> {
  const conds = [opts.activeOnly === false ? undefined : eq(games.isActive, true)];
  if (opts.q) {
    const like = `%${opts.q}%`;
    conds.push(or(ilike(games.title, like), ilike(games.tagline, like), ilike(games.description, like)));
  }
  if (opts.category) conds.push(eq(categories.slug, opts.category));
  if (opts.featured) conds.push(eq(games.isFeatured, true));
  if (opts.players) conds.push(eq(games.players, opts.players));
  if (opts.ids?.length) conds.push(inArray(games.id, opts.ids));

  const order =
    opts.sort === "popular"
      ? [desc(games.playsCount), desc(games.ratingAvg)]
      : opts.sort === "new"
        ? [desc(games.releasedAt)]
        : opts.sort === "rating"
          ? [desc(games.ratingAvg), desc(games.ratingCount)]
          : opts.sort === "top"
            ? [desc(games.topScore)]
            : [desc(sql`${games.playsCount} * 2 + ${games.favoritesCount} * 5 + ${games.ratingCount} * 3`)];

  const rows = await db
    .select({
      id: games.id,
      slug: games.slug,
      title: games.title,
      tagline: games.tagline,
      description: games.description,
      instructions: games.instructions,
      categoryId: games.categoryId,
      engine: games.engine,
      config: games.config,
      thumbnailUrl: games.thumbnailUrl,
      accent: games.accent,
      players: games.players,
      difficulty: games.difficulty,
      ratingAvg: games.ratingAvg,
      ratingCount: games.ratingCount,
      playsCount: games.playsCount,
      favoritesCount: games.favoritesCount,
      topScore: games.topScore,
      isFeatured: games.isFeatured,
      isActive: games.isActive,
      releasedAt: games.releasedAt,
      createdAt: games.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryAccent: categories.accent,
    })
    .from(games)
    .innerJoin(categories, eq(games.categoryId, categories.id))
    .where(conds.filter(Boolean).length ? and(...conds.filter(Boolean)) : undefined)
    .orderBy(...order)
    .limit(opts.limit ?? 60);

  return rows as GameRow[];
}

export async function getGameBySlug(slug: string): Promise<GameRow | null> {
  const rows = await getGames({ activeOnly: false });
  return rows.find((g) => g.slug === slug) ?? null;
}

export async function getGameById(id: number) {
  const [row] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return row ?? null;
}

export async function getDailyChallenge() {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select({
      id: dailyChallenges.id,
      day: dailyChallenges.day,
      title: dailyChallenges.title,
      description: dailyChallenges.description,
      targetScore: dailyChallenges.targetScore,
      xpReward: dailyChallenges.xpReward,
      gameId: games.id,
      gameSlug: games.slug,
      gameTitle: games.title,
      gameAccent: games.accent,
      gameThumb: games.thumbnailUrl,
    })
    .from(dailyChallenges)
    .innerJoin(games, eq(dailyChallenges.gameId, games.id))
    .where(eq(dailyChallenges.day, today))
    .limit(1);
  if (row) return row;
  const [fallback] = await db
    .select({
      id: dailyChallenges.id,
      day: dailyChallenges.day,
      title: dailyChallenges.title,
      description: dailyChallenges.description,
      targetScore: dailyChallenges.targetScore,
      xpReward: dailyChallenges.xpReward,
      gameId: games.id,
      gameSlug: games.slug,
      gameTitle: games.title,
      gameAccent: games.accent,
      gameThumb: games.thumbnailUrl,
    })
    .from(dailyChallenges)
    .innerJoin(games, eq(dailyChallenges.gameId, games.id))
    .orderBy(desc(dailyChallenges.day))
    .limit(1);
  return fallback ?? null;
}

export async function getLeaderboard(limit = 20) {
  return db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      xp: users.xp,
      level: users.level,
      highScore: users.highScore,
      gamesPlayed: users.gamesPlayed,
      role: users.role,
    })
    .from(users)
    .where(eq(users.banned, false))
    .orderBy(desc(users.xp), desc(users.highScore))
    .limit(limit);
}

export async function getGameLeaders(gameId: number, limit = 10) {
  return db
    .select({
      score: plays.score,
      duration: plays.duration,
      createdAt: plays.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
      userId: users.id,
    })
    .from(plays)
    .leftJoin(users, eq(plays.userId, users.id))
    .where(eq(plays.gameId, gameId))
    .orderBy(desc(plays.score))
    .limit(limit);
}

export async function getReviews(gameId: number) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      likes: reviews.likes,
      hidden: reviews.hidden,
      createdAt: reviews.createdAt,
      username: users.username,
      userId: users.id,
      avatarUrl: users.avatarUrl,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.gameId, gameId), eq(reviews.hidden, false)))
    .orderBy(desc(reviews.createdAt))
    .limit(60);
}

export async function getFavoriteGameIds(userId: string) {
  const rows = await db.select({ gameId: favorites.gameId }).from(favorites).where(eq(favorites.userId, userId));
  return rows.map((r) => r.gameId);
}

export async function getRecentlyPlayed(userId: string, limit = 12) {
  const rows = await db
    .select({
      gameId: plays.gameId,
      score: plays.score,
      createdAt: plays.createdAt,
      title: games.title,
      slug: games.slug,
      thumbnailUrl: games.thumbnailUrl,
      accent: games.accent,
      categoryName: categories.name,
      categorySlug: categories.slug,
      ratingAvg: games.ratingAvg,
      ratingCount: games.ratingCount,
      players: games.players,
      difficulty: games.difficulty,
      tagline: games.tagline,
    })
    .from(plays)
    .innerJoin(games, eq(plays.gameId, games.id))
    .innerJoin(categories, eq(games.categoryId, categories.id))
    .where(eq(plays.userId, userId))
    .orderBy(desc(plays.createdAt))
    .limit(limit);
  return rows;
}

export async function getUserStats(userId: string) {
  const [agg] = await db
    .select({
      runs: count(plays.id),
      best: sql<number>`coalesce(max(${plays.score}), 0)`,
      totalScore: sql<number>`coalesce(sum(${plays.score}), 0)`,
      minutes: sql<number>`coalesce(sum(${plays.duration}), 0)`,
    })
    .from(plays)
    .where(eq(plays.userId, userId));
  const ach = await db
    .select({ id: achievements.id, code: achievements.code, name: achievements.name, description: achievements.description, icon: achievements.icon, tier: achievements.tier, xpReward: achievements.xpReward, unlockedAt: userAchievements.unlockedAt })
    .from(achievements)
    .leftJoin(userAchievements, and(eq(userAchievements.achievementId, achievements.id), eq(userAchievements.userId, userId)));
  return { ...agg, achievements: ach.map((a) => ({ ...a, unlocked: !!a.unlockedAt })) };
}

export async function getAllAchievements() {
  return db.select().from(achievements).orderBy(asc(achievements.id));
}

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      accent: categories.accent,
      count: count(games.id),
    })
    .from(categories)
    .leftJoin(games, and(eq(games.categoryId, categories.id), eq(games.isActive, true)))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
}

export async function getAdminStats() {
  const [u] = await db.select({ total: count(users.id), active: sql<number>`count(*) filter (where ${users.lastActiveAt} > now() - interval '7 days')` }).from(users);
  const [g] = await db.select({ total: count(games.id), active: count(games.id) }).from(games).where(eq(games.isActive, true));
  const [p] = await db.select({ total: count(plays.id) }).from(plays);
  const [r] = await db.select({ total: count(reviews.id) }).from(reviews);
  return { users: u, games: g, plays: p, reviews: r };
}



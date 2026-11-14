"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
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
import { hashPassword, levelFromXp, verifyPassword } from "./auth";
import { createSession, destroySession, getCurrentUser } from "./session";

export type ActionResult = { ok: boolean; error?: string; [k: string]: unknown };

/* ------------------------------- auth ------------------------------- */

export async function signupAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const alias = String(formData.get("alias") ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (username.length < 3 || username.length > 20) return { ok: false, error: "Username must be 3–20 characters." };
  if (!/^[\w.-]+$/.test(username)) return { ok: false, error: "Username may only contain letters, numbers and . _ -" };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.email} = ${email} or ${users.username} = ${username}`)
    .limit(1);
  if (existing.length) return { ok: false, error: "That email or username is already taken." };

  const [user] = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash: hashPassword(password),
      bio: alias ? `Playing as ${alias}` : "",
      xp: 0,
      level: 1,
    })
    .returning();

  await createSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return { ok: false, error: "No account found with that email." };
  if (user.banned) return { ok: false, error: "This account has been suspended." };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: "Incorrect password." };

  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveSettingsAction(input: { theme?: string; sound?: boolean; motion?: boolean; volume?: number }) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  await db
    .update(users)
    .set({
      theme: input.theme ?? user.theme,
      sound: input.sound ?? user.sound,
      motion: input.motion ?? user.motion,
    })
    .where(eq(users.id, user.id));
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to edit your profile." };
  const username = String(formData.get("username") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 240);
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  if (username.length < 3) return { ok: false, error: "Username must be at least 3 characters." };

  const clash = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (clash.length && clash[0].id !== user.id) return { ok: false, error: "That username is already taken." };

  await db.update(users).set({ username, bio, avatarUrl }).where(eq(users.id, user.id));
  revalidatePath("/profile");
  return { ok: true };
}

/* ----------------------------- favorites ---------------------------- */

export async function toggleFavoriteAction(gameId: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to save favorites." };
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.gameId, gameId)))
    .limit(1);
  if (existing.length) {
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.gameId, gameId)));
    await db.update(games).set({ favoritesCount: sql`greatest(0, ${games.favoritesCount} - 1)` }).where(eq(games.id, gameId));
  } else {
    await db.insert(favorites).values({ userId: user.id, gameId });
    await db.update(games).set({ favoritesCount: sql`${games.favoritesCount} + 1` }).where(eq(games.id, gameId));
    await checkAchievements(user.id, "favorite");
  }
  revalidatePath("/", "layout");
  return { ok: true as const, favorited: !existing.length };
}

/* ------------------------------- reviews ---------------------------- */

export async function submitReviewAction(gameId: number, rating: number, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to leave a review." };
  const clean = body.trim().slice(0, 1200);
  if (!clean) return { ok: false as const, error: "Write a few words first." };
  await db.insert(reviews).values({ userId: user.id, gameId, rating: Math.max(1, Math.min(5, rating)), body: clean });

  const agg = await db
    .select({ avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`, n: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.gameId, gameId), eq(reviews.hidden, false)));
  await db
    .update(games)
    .set({ ratingAvg: String(Number(agg[0].avg).toFixed(2)), ratingCount: Number(agg[0].n) })
    .where(eq(games.id, gameId));

  await checkAchievements(user.id, "review");
  revalidatePath(`/games/[slug]`, "page");
  return { ok: true as const };
}

export async function deleteReviewAction(reviewId: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not authorised." };
  const [row] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!row) return { ok: false as const, error: "Review not found." };
  if (row.userId !== user.id && user.role !== "admin") return { ok: false as const, error: "Not authorised." };
  await db.delete(reviews).where(eq(reviews.id, reviewId));
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/* ------------------------------- scoring ---------------------------- */

export async function submitScoreAction(input: { gameId: number; score: number; duration: number }) {
  const user = await getCurrentUser();
  const game = await db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
  if (!game.length) return { ok: false as const, error: "Unknown game." };

  const score = Math.max(0, Math.round(input.score));
  const xpEarned = Math.round(Math.min(600, score / 12) + 30);

  await db.insert(plays).values({
    userId: user?.id ?? null,
    gameId: input.gameId,
    score,
    duration: Math.max(0, Math.round(input.duration)),
    xpEarned: user ? xpEarned : 0,
  });
  await db
    .update(games)
    .set({
      playsCount: sql`${games.playsCount} + 1`,
      topScore: sql`greatest(${games.topScore}, ${score})`,
    })
    .where(eq(games.id, input.gameId));

  if (!user) return { ok: true as const, xp: 0, level: 1, unlocked: [], guest: true };

  const newXp = user.xp + xpEarned;
  const newLevel = levelFromXp(newXp);
  await db
    .update(users)
    .set({
      xp: newXp,
      level: newLevel,
      gamesPlayed: sql`${users.gamesPlayed} + 1`,
      highScore: sql`greatest(${users.highScore}, ${score})`,
      coins: sql`${users.coins} + ${Math.round(xpEarned / 2)}`,
      lastActiveAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const unlocked = await checkAchievements(user.id, "play", { score, gameId: input.gameId });
  revalidatePath("/", "layout");
  return { ok: true as const, xp: xpEarned, level: newLevel, unlocked, guest: false };
}

/* ---------------------------- achievements -------------------------- */

async function checkAchievements(
  userId: string,
  trigger: "play" | "favorite" | "review",
  ctx?: { score: number; gameId: number }
): Promise<string[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];

  const [{ runs }] = await db
    .select({ runs: sql<number>`count(*)` })
    .from(plays)
    .where(eq(plays.userId, userId));
  const [{ favs }] = await db
    .select({ favs: sql<number>`count(*)` })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  const [{ revs }] = await db
    .select({ revs: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.userId, userId));
  const [{ cats }] = await db
    .select({ cats: sql<number>`count(distinct ${games.categoryId})` })
    .from(plays)
    .innerJoin(games, eq(plays.gameId, games.id))
    .where(eq(plays.userId, userId));

  const today = new Date().toISOString().slice(0, 10);
  const challenge = await db.select().from(dailyChallenges).where(eq(dailyChallenges.day, today)).limit(1);

  const unlockedIds = new Set(
    (await db.select({ id: userAchievements.achievementId }).from(userAchievements).where(eq(userAchievements.userId, userId))).map(
      (r) => r.id
    )
  );

  const all = await db.select().from(achievements);
  const earned: string[] = [];
  for (const a of all) {
    if (unlockedIds.has(a.id)) continue;
    let hit = false;
    switch (a.code) {
      case "first_coin":
        hit = runs >= 1;
        break;
      case "five_runs":
        hit = runs >= 5;
        break;
      case "marathon":
        hit = runs >= 25;
        break;
      case "score_1k":
        hit = (ctx?.score ?? 0) >= 1000;
        break;
      case "score_5k":
        hit = (ctx?.score ?? 0) >= 5000;
        break;
      case "score_10k":
        hit = (ctx?.score ?? 0) >= 10000;
        break;
      case "first_fav":
        hit = trigger === "favorite" && favs >= 1;
        break;
      case "five_favs":
        hit = favs >= 5;
        break;
      case "first_review":
        hit = trigger === "review" && revs >= 1;
        break;
      case "explorer":
        hit = cats >= 5;
        break;
      case "level_5":
        hit = levelFromXp(user.xp) >= 5;
        break;
      case "challenge":
        hit = !!challenge.length && (ctx?.score ?? 0) >= challenge[0].targetScore;
        break;
    }
    if (hit) {
      await db.insert(userAchievements).values({ userId, achievementId: a.id }).onConflictDoNothing();
      await db.update(users).set({ xp: user.xp + a.xpReward, coins: user.coins + a.xpReward }).where(eq(users.id, userId));
      earned.push(a.name);
    }
  }
  return earned;
}

/* -------------------------------- admin ----------------------------- */

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Administrator access required.");
  return user;
}

export type GameInput = {
  id?: number;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  instructions: string;
  categoryId: number;
  engine: string;
  thumbnailUrl: string;
  accent: string;
  players: string;
  difficulty: string;
  isFeatured: boolean;
  isActive: boolean;
  config: string;
};

export async function saveGameAction(input: GameInput): Promise<ActionResult> {
  await requireAdmin();
  let config: Record<string, unknown> = {};
  try {
    config = input.config ? (JSON.parse(input.config) as Record<string, unknown>) : {};
  } catch {
    return { ok: false, error: "Config must be valid JSON." };
  }
  const values = {
    title: input.title.trim(),
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    tagline: input.tagline,
    description: input.description,
    instructions: input.instructions,
    categoryId: Number(input.categoryId),
    engine: input.engine,
    thumbnailUrl: input.thumbnailUrl,
    accent: input.accent,
    players: input.players,
    difficulty: input.difficulty,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    config,
  };
  if (!values.title || !values.slug) return { ok: false, error: "Title and slug are required." };

  if (input.id) {
    await db.update(games).set(values).where(eq(games.id, input.id));
  } else {
    await db.insert(games).values(values);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteGameAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(games).where(eq(games.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleFeaturedAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const [g] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  if (!g) return { ok: false, error: "Game not found." };
  await db.update(games).set({ isFeatured: !g.isFeatured }).where(eq(games.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleGameActiveAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const [g] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  if (!g) return { ok: false, error: "Game not found." };
  await db.update(games).set({ isActive: !g.isActive }).where(eq(games.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(users).set({ role: role === "admin" ? "admin" : "user" }).where(eq(users.id, userId));
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleBanAction(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { ok: false, error: "User not found." };
  await db.update(users).set({ banned: !u.banned }).where(eq(users.id, userId));
  revalidatePath("/admin");
  return { ok: true };
}

export async function hideReviewAction(id: number, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(reviews).set({ hidden }).where(eq(reviews.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveCategoryAction(input: { id?: number; slug: string; name: string; description: string; icon: string; accent: string }): Promise<ActionResult> {
  await requireAdmin();
  const values = {
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    name: input.name.trim(),
    description: input.description,
    icon: input.icon,
    accent: input.accent,
  };
  if (!values.slug || !values.name) return { ok: false, error: "Name and slug are required." };
  if (input.id) await db.update(categories).set(values).where(eq(categories.id, input.id));
  else await db.insert(categories).values(values);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const used = await db.select({ id: games.id }).from(games).where(eq(games.categoryId, id)).limit(1);
  if (used.length) return { ok: false, error: "Category still has games." };
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getAdminTables() {
  await requireAdmin();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
  const allGames = await db.select().from(games).orderBy(desc(games.createdAt)).limit(200);
  const allReviews = await db
    .select({
      id: reviews.id,
      body: reviews.body,
      rating: reviews.rating,
      hidden: reviews.hidden,
      createdAt: reviews.createdAt,
      username: users.username,
      gameTitle: games.title,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(games, eq(reviews.gameId, games.id))
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return { allUsers, allGames, allReviews, allCategories };
}

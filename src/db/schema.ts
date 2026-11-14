import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  numeric,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash"),
    googleId: text("google_id"),
    avatarUrl: text("avatar_url"),
    bio: text("bio").default(""),
    role: text("role").default("user").notNull(), // user | admin
    xp: integer("xp").default(0).notNull(),
    level: integer("level").default(1).notNull(),
    coins: integer("coins").default(0).notNull(),
    gamesPlayed: integer("games_played").default(0).notNull(),
    highScore: integer("high_score").default(0).notNull(),
    theme: text("theme").default("dark").notNull(),
    sound: boolean("sound").default(true).notNull(),
    motion: boolean("motion").default(true).notNull(),
    banned: boolean("banned").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), uniqueIndex("users_username_idx").on(t.username)]
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  icon: text("icon").default("gamepad").notNull(),
  accent: text("accent").default("#7C3AED").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    tagline: text("tagline").default("").notNull(),
    description: text("description").default("").notNull(),
    instructions: text("instructions").default("").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    engine: text("engine").notNull(),
    config: jsonb("config").default({}).notNull(),
    thumbnailUrl: text("thumbnail_url").default("").notNull(),
    accent: text("accent").default("#7C3AED").notNull(),
    players: text("players").default("1 Player").notNull(),
    difficulty: text("difficulty").default("Medium").notNull(),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0").notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    playsCount: integer("plays_count").default(0).notNull(),
    favoritesCount: integer("favorites_count").default(0).notNull(),
    topScore: integer("top_score").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    releasedAt: timestamp("released_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("games_category_idx").on(t.categoryId)]
);

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.gameId] })]
);

export const plays = pgTable(
  "plays",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    score: integer("score").default(0).notNull(),
    duration: integer("duration").default(0).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("plays_user_idx").on(t.userId), index("plays_game_idx").on(t.gameId)]
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  rating: integer("rating").default(5).notNull(),
  body: text("body").default("").notNull(),
  likes: integer("likes").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  icon: text("icon").default("trophy").notNull(),
  xpReward: integer("xp_reward").default(100).notNull(),
  tier: text("tier").default("bronze").notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })]
);

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  day: date("day").notNull().unique(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  targetScore: integer("target_score").default(1000).notNull(),
  xpReward: integer("xp_reward").default(250).notNull(),
});

export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;

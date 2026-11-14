import pg from "pg";
import crypto from "node:crypto";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});
await client.connect();

function hash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

const wipe = [
  "user_achievements",
  "achievements",
  "reviews",
  "plays",
  "favorites",
  "daily_challenges",
  "games",
  "categories",
  "users",
];
for (const t of wipe) await client.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);

const categories = [
  ["action", "Action", "High-intensity reflex combat and explosive set-pieces.", "flame", "#FF6B4A", 1],
  ["adventure", "Adventure", "Explore, survive and uncover what is hidden.", "compass", "#22D3EE", 2],
  ["racing", "Racing", "Velocity, drift and split-second overtakes.", "gauge", "#FFB020", 3],
  ["shooting", "Shooting", "Lock on, fire, and clear the sector.", "crosshair", "#F43F5E", 4],
  ["sports", "Sports", "Penalties, hoops and stadium pressure.", "trophy", "#34D399", 5],
  ["puzzle", "Puzzle", "Systems, patterns and satisfying clears.", "blocks", "#A78BFA", 6],
  ["strategy", "Strategy", "Read the board, think two moves ahead.", "swords", "#60A5FA", 7],
  ["multiplayer", "Multiplayer", "Compete locally and climb the global board.", "users", "#F472B6", 8],
  ["arcade", "Arcade", "Pure coin-op loops. Chase the high score.", "joystick", "#7C3AED", 9],
  ["minecraft", "Voxel & Building", "Mine, place and shape a blocky world.", "box", "#84CC16", 10],
  ["horror", "Horror", "Dark corridors, tight resources, no second chances.", "skull", "#7C3AED", 11],
  ["simulator", "Simulator", "Physics, patience and a steady hand.", "plane", "#22D3EE", 12],
  ["platformer", "Platformer", "Timing, momentum and perfect landings.", "footprints", "#FB923C", 13],
  ["classic", "Classic", "The timeless rules that started it all.", "cassette", "#9A9AB8", 14],
];

for (const [slug, name, description, icon, accent, sortOrder] of categories) {
  await client.query(
    `INSERT INTO categories (slug, name, description, icon, accent, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
    [slug, name, description, icon, accent, sortOrder]
  );
}

const achievements = [
  ["first_coin", "Insert Coin", "Play your first game.", "coins", 50, "bronze"],
  ["five_runs", "Regular", "Finish 5 game runs.", "gamepad", 100, "bronze"],
  ["score_1k", "Four Digits", "Score 1,000 points in a single run.", "zap", 150, "bronze"],
  ["score_5k", "High Roller", "Score 5,000 points in a single run.", "zap", 300, "silver"],
  ["score_10k", "Legend of the Cabinet", "Score 10,000 points in a single run.", "crown", 600, "gold"],
  ["first_fav", "Curator", "Add a game to your favorites.", "heart", 50, "bronze"],
  ["five_favs", "Collector", "Favorite 5 different games.", "heart", 150, "silver"],
  ["first_review", "Critic", "Write your first review.", "message-square", 100, "bronze"],
  ["explorer", "Explorer", "Play games from 5 different categories.", "compass", 250, "silver"],
  ["level_5", "Seasoned", "Reach level 5.", "star", 300, "silver"],
  ["marathon", "Marathon", "Complete 25 game runs.", "activity", 500, "gold"],
  ["challenge", "Challenger", "Beat a daily challenge target.", "target", 400, "gold"],
];
for (const [code, name, description, icon, xpReward, tier] of achievements) {
  await client.query(
    `INSERT INTO achievements (code, name, description, icon, xp_reward, tier) VALUES ($1,$2,$3,$4,$5,$6)`,
    [code, name, description, icon, xpReward, tier]
  );
}

const games = [
  {
    slug: "neon-snake", title: "Neon Snake", engine: "snake", cat: "arcade",
    tagline: "The oldest loop in the arcade, rebuilt in neon.",
    description:
      "Guide a growing ribbon of light through a wireframe grid. Every pulse you eat makes you longer and faster — the only enemy is your own tail. Chain pulses without hitting a wall to build a multiplier and watch the amber score counter climb.",
    instructions:
      "Arrow keys or WASD to steer. Swipe on touch screens. Eat the glowing pulses, avoid the walls and your own trail. Press P to pause, R to restart.",
    thumb: "images/art-snake.jpg", accent: "#22D3EE", difficulty: "Easy", players: "1 Player",
    config: { speed: 8, growth: 3 },
  },
  {
    slug: "brick-breaker", title: "Brick Breaker", engine: "breakout", cat: "action",
    tagline: "One paddle. Eight rows. Zero mercy.",
    description:
      "Smash through a wall of energy bricks with a single ricocheting orb. Catch falling power cells to widen your paddle, slow time or split the orb into three. Clear the wall before you run out of shields.",
    instructions:
      "Move the paddle with the mouse, arrow keys or A/D. Click or press Space to launch the orb. Press P to pause, R to restart.",
    thumb: "images/art-blocks.jpg", accent: "#A78BFA", difficulty: "Medium", players: "1 Player",
    config: { rows: 6, lives: 3 },
  },
  {
    slug: "space-blaster", title: "Space Blaster", engine: "shooter", cat: "shooting",
    tagline: "Clear the sector. Then clear it again.",
    description:
      "A vertical shooter in the coin-op tradition. Enemy waves descend in formation, elite aces weave across the lane, and a boss carrier drops in every fifth wave. Collect violet cores to upgrade your cannons.",
    instructions:
      "Arrow keys or WASD to fly, Space to fire (hold for auto-fire). Touch and drag to fly, tap to shoot. Press P to pause, R to restart.",
    thumb: "images/art-shooter.jpg", accent: "#F43F5E", difficulty: "Medium", players: "1 Player",
    config: { fireRate: 220, waves: true },
  },
  {
    slug: "asteroid-siege", title: "Asteroid Siege", engine: "shooter", cat: "shooting",
    tagline: "They come in pieces.",
    description:
      "A slower, heavier shooter: your gunship drifts through a dense asteroid field where every rock splits into smaller fragments when destroyed. Survival is scored by the second, so evasive flying beats trigger discipline.",
    instructions:
      "Arrow keys or WASD to move, Space to fire. Rocks split when shot — never let them surround you. Press P to pause, R to restart.",
    thumb: "images/art-shooter.jpg", accent: "#FFB020", difficulty: "Hard", players: "1 Player",
    config: { fireRate: 320, asteroids: true },
  },
  {
    slug: "turbo-drift", title: "Turbo Drift", engine: "racer", cat: "racing",
    tagline: "Hold the line at 300 km/h.",
    description:
      "Thread a night highway packed with traffic. Every near-miss charges your boost meter; every clean overtake adds to the multiplier. The road accelerates the longer you survive, and one clipped bumper ends the run.",
    instructions:
      "Left/Right arrows or A/D to change lanes, Up to boost, Down to brake. Touch: tap left/right half of the canvas. Press P to pause, R to restart.",
    thumb: "images/art-racer.jpg", accent: "#FFB020", difficulty: "Medium", players: "1 Player",
    config: { lanes: 4 },
  },
  {
    slug: "neon-highway", title: "Neon Highway", engine: "racer", cat: "racing",
    tagline: "Rain, reflections and no brakes.",
    description:
      "The wet-weather variant of Turbo Drift: five lanes, lower visibility and longer traffic convoys. Slipstream behind a vehicle to build speed, then dart through the gap for a near-miss bonus.",
    instructions:
      "Left/Right arrows or A/D to steer, Up to boost. Stay close behind traffic to charge boost faster. Press P to pause, R to restart.",
    thumb: "images/art-racer.jpg", accent: "#22D3EE", difficulty: "Hard", players: "1 Player",
    config: { lanes: 5, rain: true },
  },
  {
    slug: "cyber-runner", title: "Cyber Runner", engine: "runner", cat: "platformer",
    tagline: "Run the rooftops of a dead city.",
    description:
      "An endless rooftop sprint across a neon skyline. Leap the gaps, slide under the drone barriers and stomp the patrol bots for bonus points. The skyline scrolls faster the further you get.",
    instructions:
      "Space, Up arrow or W to jump (hold for a higher jump). Down arrow or S to slide. Touch: tap to jump, swipe down to slide. Press P to pause, R to restart.",
    thumb: "images/art-arena.jpg", accent: "#FB923C", difficulty: "Medium", players: "1 Player",
    config: { gravity: 1 },
  },
  {
    slug: "shadow-sprint", title: "Shadow Sprint", engine: "runner", cat: "platformer",
    tagline: "Double jumps, tight gaps, no looking back.",
    description:
      "A harder rooftop variant with double-jump air control, moving platforms and narrow laser gates. Designed for players who have already memorised Cyber Runner's rhythm.",
    instructions:
      "Space/Up to jump, press again in mid-air to double jump. Down to slide under lasers. Press P to pause, R to restart.",
    thumb: "images/art-arena.jpg", accent: "#A78BFA", difficulty: "Hard", players: "1 Player",
    config: { gravity: 0.85, doubleJump: true },
  },
  {
    slug: "blockfall", title: "Blockfall", engine: "blocks", cat: "puzzle",
    tagline: "Seven shapes, ten thousand decisions.",
    description:
      "The definitive falling-block puzzle. Rotate and place tetrominoes to complete horizontal lines, which clear and score. Clearing multiple lines at once multiplies the reward and pushes the drop speed up.",
    instructions:
      "Left/Right to move, Up or X to rotate, Down to soft drop, Space to hard drop. P to pause, R to restart.",
    thumb: "images/art-blocks.jpg", accent: "#7C3AED", difficulty: "Medium", players: "1 Player",
    config: { mode: "classic" },
  },
  {
    slug: "color-collapse", title: "Color Collapse", engine: "blocks", cat: "puzzle",
    tagline: "Same shape, faster clock.",
    description:
      "A speed variant of Blockfall: the pieces fall faster from the first second and only two-block clears score. Built for players who want the puzzle loop at arcade tempo.",
    instructions:
      "Left/Right to move, Up to rotate, Space to hard drop. Clear lines before they reach the ceiling. P to pause, R to restart.",
    thumb: "images/art-blocks.jpg", accent: "#22D3EE", difficulty: "Hard", players: "1 Player",
    config: { mode: "blitz" },
  },
  {
    slug: "memory-matrix", title: "Memory Matrix", engine: "memory", cat: "classic",
    tagline: "Watch the grid. Repeat the grid.",
    description:
      "A pattern-memory test in the mould of the old handheld classics. A sequence of tiles lights up; you reproduce it. Each round adds one more tile to the chain, and the grid grows with it.",
    instructions:
      "Click or tap the tiles in the same order they flashed. Arrow keys + Enter also work. One mistake ends the run. P to pause, R to restart.",
    thumb: "", accent: "#A78BFA", difficulty: "Easy", players: "1 Player",
    config: { grid: 3 },
  },
  {
    slug: "simon-pulse", title: "Simon Pulse", engine: "memory", cat: "multiplayer",
    tagline: "Four colours, one reflex war.",
    description:
      "The four-panel rhythm memory game, tuned for competition: sequences accelerate every round and the score multiplier grows with each flawless repetition. Post your run to the global board.",
    instructions:
      "Click the coloured panels in the order they pulse. Keys 1-4 map to the four panels. Any miss ends the run. P to pause, R to restart.",
    thumb: "", accent: "#F472B6", difficulty: "Medium", players: "1 Player",
    config: { grid: 2 },
  },
  {
    slug: "haunted-corridor", title: "Haunted Corridor", engine: "maze", cat: "horror",
    tagline: "Your flashlight is the only safe thing here.",
    description:
      "Navigate a dark facility collecting fuse cells while something patient hunts you. Your light cone reveals the map but also your position — the darker you stay, the safer you are.",
    instructions:
      "Arrow keys or WASD to move. Collect all the fuse cells, then reach the exit. Keep away from the stalker — it is faster than you in the open. P to pause, R to restart.",
    thumb: "images/art-horror.jpg", accent: "#7C3AED", difficulty: "Hard", players: "1 Player",
    config: { hunters: 1 },
  },
  {
    slug: "dungeon-dash", title: "Dungeon Dash", engine: "maze", cat: "adventure",
    tagline: "Grab the relics, dodge the sentries.",
    description:
      "A brighter maze adventure: raid a procedurally lit dungeon for relics while two sentry drones patrol the corridors. Each relic collected opens the exit and adds time to the clock.",
    instructions:
      "Arrow keys or WASD to move. Collect every relic, then reach the glowing exit tile. Sentries move on fixed patrol routes — learn them. P to pause, R to restart.",
    thumb: "images/art-horror.jpg", accent: "#22D3EE", difficulty: "Medium", players: "1 Player",
    config: { hunters: 2 },
  },
  {
    slug: "voxel-miner", title: "Voxel Miner", engine: "voxel", cat: "minecraft",
    tagline: "A pocket block world you can reshape.",
    description:
      "A sandbox block world in your browser. Mine stone, dirt and ore with the left tool, place blocks with the right, and build whatever you want across a procedurally generated island. Ore is worth points, building is worth nothing but satisfaction.",
    instructions:
      "Click a block to mine it. Press 1-4 to select a block type, then click an empty tile to place it. Arrow keys or WASD scroll the world. R regenerates a new island.",
    thumb: "images/art-voxel.jpg", accent: "#84CC16", difficulty: "Easy", players: "1 Player",
    config: { size: 16 },
  },
  {
    slug: "sky-chopper", title: "Sky Chopper", engine: "sim", cat: "simulator",
    tagline: "Rotor physics, thin air, narrow gates.",
    description:
      "A gentle helicopter sim: hold throttle to climb, release to sink, and thread a canyon of signal towers. Wind gusts push you off course at higher altitudes, so the safest line is rarely the highest one.",
    instructions:
      "Hold Space, Up arrow or the mouse button to climb; release to descend. Fly through the gaps in the towers. P to pause, R to restart.",
    thumb: "images/art-racer.jpg", accent: "#22D3EE", difficulty: "Medium", players: "1 Player",
    config: { wind: true },
  },
  {
    slug: "penalty-pro", title: "Penalty Pro", engine: "sports", cat: "sports",
    tagline: "Twelve yards. One keeper. Read the dive.",
    description:
      "A penalty shootout duel against a keeper who learns your habits. Aim with the targeting arc, choose power over placement at your peril, and win five rounds to bank the match bonus.",
    instructions:
      "Move the mouse or use Left/Right to aim, click or press Space to shoot. The keeper dives faster as the rounds progress. P to pause, R to restart.",
    thumb: "images/art-arena.jpg", accent: "#34D399", difficulty: "Medium", players: "1 Player",
    config: { rounds: 5 },
  },
  {
    slug: "hoop-shot", title: "Hoop Shot", engine: "sports", cat: "sports",
    tagline: "Timing beats power, every time.",
    description:
      "A three-point shooting arcade: the hoop drifts left and right on a moving rail while a shot meter cycles. Release at the perfect moment for a swish; mistime it and you clang the rim.",
    instructions:
      "Click or press Space to release when the moving meter lines up with the green band. Hold longer for more arc. P to pause, R to restart.",
    thumb: "images/art-arena.jpg", accent: "#FFB020", difficulty: "Medium", players: "1 Player",
    config: { rounds: 10 },
  },
  {
    slug: "grid-duel", title: "Grid Duel", engine: "duel", cat: "strategy",
    tagline: "Three in a row, against a machine that reads you.",
    description:
      "Tic-tac-toe on a 3x3 board against a minimax opponent that never blunders. Force a draw and you score; win and you score far more. The only way to win is to play perfectly and wait for a slip.",
    instructions:
      "Click an empty cell to place your mark. Play as violet, the machine plays amber. Win for 500 points, draw for 150. R starts a new board.",
    thumb: "", accent: "#60A5FA", difficulty: "Hard", players: "1 Player",
    config: { ai: "minimax" },
  },
  {
    slug: "tic-tac-overdrive", title: "Tic-Tac-Overdrive", engine: "duel", cat: "multiplayer",
    tagline: "Five boards. One hot-seat showdown.",
    description:
      "The local two-player variant of Grid Duel: pass the keyboard and take turns on a shared board, with streak bonuses for consecutive wins. Ideal for a shared screen.",
    instructions:
      "Player 1 clicks to place violet marks, Player 2 places amber marks. The board resets and the streak counter continues. R clears the board.",
    thumb: "", accent: "#F472B6", difficulty: "Easy", players: "2 Players",
    config: { ai: "local" },
  },
];

const catIds = {};
const { rows: catRows } = await client.query(`SELECT id, slug FROM categories`);
for (const r of catRows) catIds[r.slug] = r.id;

const featured = new Set(["neon-snake", "space-blaster", "turbo-drift", "blockfall", "haunted-corridor"]);
const gameIds = {};
for (const g of games) {
  const { rows } = await client.query(
    `INSERT INTO games (slug, title, tagline, description, instructions, category_id, engine, config, thumbnail_url, accent, players, difficulty, is_featured, rating_avg, rating_count, plays_count, favorites_count, top_score, released_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,0,0,0,0,$15) RETURNING id`,
    [
      g.slug,
      g.title,
      g.tagline,
      g.description,
      g.instructions,
      catIds[g.cat],
      g.engine,
      JSON.stringify(g.config),
      g.thumb,
      g.accent,
      g.players,
      g.difficulty,
      featured.has(g.slug),
      (Math.round((3.6 + Math.random() * 1.3) * 10) / 10).toFixed(2),
      new Date(Date.now() - Math.floor(Math.random() * 40) * 86400000),
    ]
  );
  gameIds[g.slug] = rows[0].id;
}

// Users
const users = [
  ["admin@gameverse.gg", "ArcadeWarden", "admin", 12400, 14, "Platform administrator. Keep the cabinets running."],
  ["mira@gameverse.gg", "MiraVex", "user", 8600, 11, "Speedrunner. Neon Highway is my happy place."],
  ["dex@gameverse.gg", "DexOrbital", "user", 6100, 9, "Puzzle obsessive. Send me your hardest levels."],
  ["nyx@gameverse.gg", "NyxByte", "user", 4250, 7, "Horror fan, chicken in real life."],
  ["sol@gameverse.gg", "SolarFlare", "user", 2100, 5, "Here for the leaderboards."],
];
const userIds = {};
for (const [email, username, role, xp, level, bio] of users) {
  const { rows } = await client.query(
    `INSERT INTO users (id, email, username, password_hash, role, xp, level, coins, games_played, high_score, bio, avatar_url, created_at, last_active_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now() - interval '60 days', now() - interval '2 hours') RETURNING id`,
    [crypto.randomUUID(), email, username, hash("gameverse"), role, xp, level, xp * 2, level * 12, xp, bio, ""]
  );
  userIds[email] = rows[0].id;
}

// Reviews
const reviewBodies = [
  [5, "The movement feels exactly right. I keep coming back for one more run."],
  [4, "Great loop, though the difficulty ramp in the middle is steep."],
  [5, "Best browser version of this I have played. Fullscreen mode is a nice touch."],
  [3, "Fun for a few minutes, would love more variety in the levels."],
  [5, "The CRT treatment and the score counter make this feel like the real cabinet."],
  [4, "Solid. Controls are tight and it loads instantly."],
];
const userIdList = Object.values(userIds);
for (const [email, slug] of [
  ["mira@gameverse.gg", "neon-snake"],
  ["dex@gameverse.gg", "blockfall"],
  ["nyx@gameverse.gg", "haunted-corridor"],
  ["sol@gameverse.gg", "turbo-drift"],
  ["mira@gameverse.gg", "space-blaster"],
  ["dex@gameverse.gg", "voxel-miner"],
  ["nyx@gameverse.gg", "cyber-runner"],
  ["sol@gameverse.gg", "grid-duel"],
  ["mira@gameverse.gg", "memory-matrix"],
]) {
  const [rating, body] = reviewBodies[Math.floor(Math.random() * reviewBodies.length)];
  await client.query(
    `INSERT INTO reviews (user_id, game_id, rating, body, likes, created_at) VALUES ($1,$2,$3,$4,$5, now() - interval '${Math.floor(Math.random() * 20) + 1} days')`,
    [userIds[email], gameIds[slug], rating, body, Math.floor(Math.random() * 24)]
  );
}

// Plays + favorites
for (let i = 0; i < 90; i++) {
  const uid = userIdList[Math.floor(Math.random() * userIdList.length)];
  const g = games[Math.floor(Math.random() * games.length)];
  await client.query(
    `INSERT INTO plays (user_id, game_id, score, duration, xp_earned, created_at) VALUES ($1,$2,$3,$4,$5, now() - interval '${Math.floor(Math.random() * 72) + 1} hours')`,
    [uid, gameIds[g.slug], Math.floor(Math.random() * 9000), Math.floor(Math.random() * 600) + 30, Math.floor(Math.random() * 200) + 20]
  );
}
for (const [email, slugs] of [
  ["mira@gameverse.gg", ["neon-snake", "turbo-drift", "space-blaster"]],
  ["dex@gameverse.gg", ["blockfall", "memory-matrix", "grid-duel", "color-collapse"]],
  ["nyx@gameverse.gg", ["haunted-corridor", "dungeon-dash"]],
  ["sol@gameverse.gg", ["cyber-runner", "penalty-pro"]],
]) {
  for (const s of slugs) {
    await client.query(`INSERT INTO favorites (user_id, game_id) VALUES ($1,$2)`, [userIds[email], gameIds[s]]);
    await client.query(`UPDATE games SET favorites_count = favorites_count + 1 WHERE id = $1`, [gameIds[s]]);
  }
}

// Daily challenges
const challengePlan = [
  [-2, "blockfall", "Clear 8 lines", "Finish a Blockfall run with at least 8 line clears.", 2000, 250],
  [-1, "neon-snake", "Serpent Overdrive", "Score at least 1,500 points in Neon Snake.", 1500, 250],
  [0, "space-blaster", "Sector Sweep", "Reach wave 4 and score 3,000 points in Space Blaster.", 3000, 300],
  [1, "turbo-drift", "Near-Miss King", "Bank 2,500 points in Turbo Drift without crashing.", 2500, 300],
  [2, "haunted-corridor", "Lights Out", "Collect every fuse cell and escape the corridor.", 1800, 350],
];
for (const [offset, slug, title, description, targetScore, xp] of challengePlan) {
  const day = new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  await client.query(
    `INSERT INTO daily_challenges (day, game_id, title, description, target_score, xp_reward) VALUES ($1,$2,$3,$4,$5,$6)`,
    [day, gameIds[slug], title, description, targetScore, xp]
  );
}

// A few unlocked achievements
for (const uid of userIdList) {
  const count = 2 + Math.floor(Math.random() * 5);
  const { rows: ach } = await client.query(`SELECT id FROM achievements ORDER BY random() LIMIT $1`, [count]);
  for (const a of ach) {
    await client.query(`INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid, a.id]);
  }
}

await client.query(`UPDATE games SET plays_count = (SELECT count(*) FROM plays WHERE plays.game_id = games.id)`);
await client.query(`UPDATE games SET top_score = COALESCE((SELECT max(score) FROM plays WHERE plays.game_id = games.id), 0)`);

console.log("Seeded:", (await client.query("SELECT count(*) FROM games")).rows[0].count, "games");
await client.end();

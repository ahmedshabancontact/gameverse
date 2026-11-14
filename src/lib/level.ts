/** Level curve: 100 * (level - 1)^1.6 XP per level. Shared client + server. */
export function xpForLevel(level: number) {
  return Math.round(100 * Math.pow(level - 1, 1.6));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    floor,
    ceil,
    into: xp - floor,
    need: Math.max(1, ceil - floor),
    pct: Math.min(100, Math.round(((xp - floor) / Math.max(1, ceil - floor)) * 100)),
  };
}

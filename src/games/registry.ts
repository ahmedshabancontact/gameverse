import { blocks, breakout, duel, memory, snake } from "./engines-arcade";
import { racer, runner, shooter, sim } from "./engines-action";
import { maze, sports, voxel } from "./engines-world";
import type { EngineFactory } from "./kit";

export const engines: Record<string, EngineFactory> = {
  snake,
  breakout,
  blocks,
  memory,
  duel,
  shooter,
  racer,
  runner,
  sim,
  voxel,
  maze,
  sports,
};

export type EngineName = keyof typeof engines;

export const ENGINE_BLURB: Record<string, string> = {
  snake: "Grid · Growth · Multiplier",
  breakout: "Paddle · Ricochet · Power cells",
  blocks: "Falling blocks · Line clears",
  memory: "Sequence · Recall",
  duel: "Board · Minimax CPU",
  shooter: "Waves · Cannons · Boss carrier",
  racer: "Traffic · Boost · Near misses",
  runner: "Jump · Slide · Distance",
  sim: "Rotor physics · Canyon gates",
  voxel: "Mining · Building · Sandbox",
  maze: "Maze · Collect · Escape",
  sports: "Aiming · Timing · Keeper",
};

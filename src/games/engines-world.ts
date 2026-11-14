import { beginGame, blip, clamp, drawOver, glowText, panelGrid, rand, VH, VW, type EngineFactory } from "./kit";

/* ------------------------------------------------------------------ */
/* VOXEL MINER                                                         */
/* ------------------------------------------------------------------ */
export const voxel: EngineFactory = (canvas, api, config) => {
  const TILE = 40;
  const COLS = 40;
  const ROWS = 22;
  // 0 empty, 1 grass, 2 dirt, 3 stone, 4 ore, 5 crystal
  const COLORS = ["", "#4b7a2f", "#6b4a2c", "#4a4a63", "#FFB020", "#22D3EE"];

  let world: number[][] = [];
  let camX = 0;
  let camY = 0;
  let selected = 1;
  let score = 0;
  let mined = 0;
  let placed = 0;

  const generate = () => {
    world = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    for (let x = 0; x < COLS; x++) {
      const h = Math.round(8 + Math.sin(x * 0.32) * 3 + Math.sin(x * 0.11) * 3 + Math.random() * 1.6);
      for (let y = h; y < ROWS; y++) {
        world[y][x] = y === h ? 1 : y < h + 3 ? 2 : 3;
      }
      for (let y = h + 3; y < ROWS; y++) {
        const r = Math.random();
        if (r < 0.09) world[y][x] = 4;
        else if (r < 0.12) world[y][x] = 5;
      }
    }
  };

  const reset = () => {
    generate();
    score = 0;
    mined = 0;
    placed = 0;
    camX = 0;
    camY = 0;
    api.setScore(0);
    api.setStatus("Click to mine · 1-4 to pick a block, click empty to build");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      const sp = 460 * dt;
      if (input.down("arrowleft", "a")) camX -= sp;
      if (input.down("arrowright", "d")) camX += sp;
      if (input.down("arrowup", "w")) camY -= sp;
      if (input.down("arrowdown", "s")) camY += sp;
      camX = clamp(camX, 0, COLS * TILE - VW);
      camY = clamp(camY, 0, ROWS * TILE - VH);

      if (input.hit("1")) selected = 1;
      if (input.hit("2")) selected = 2;
      if (input.hit("3")) selected = 3;
      if (input.hit("5")) selected = 5;

      if (input.pointer.justDown) {
        const tx = Math.floor((input.pointer.x + camX) / TILE);
        const ty = Math.floor((input.pointer.y + camY) / TILE);
        if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
          const v = world[ty][tx];
          if (v !== 0) {
            const gain = v === 4 ? 220 : v === 5 ? 420 : 25;
            score += gain;
            mined++;
            world[ty][tx] = 0;
            api.setScore(score);
            api.setStatus(`Mined ${["", "grass", "dirt", "stone", "amber ore", "crystal"][v]} · +${gain}`);
            blip.play(v >= 4 ? 720 : 260, 0.08, v >= 4 ? "triangle" : "square", 0.04);
          } else {
            world[ty][tx] = selected;
            placed++;
            blip.play(180, 0.05, "square", 0.03);
            api.setStatus(`Placed block · ${placed} built, ${mined} mined`);
          }
        }
      }
      if (input.hit("r")) {
        generate();
        api.setStatus("New island generated");
      }

      stage.clear("#0b0a1c");
      const sky = ctx.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, "#221a4d");
      sky.addColorStop(0.55, "#12102c");
      sky.addColorStop(1, "#0b0a1c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VW, VH);
      ctx.save();
      ctx.translate(-camX, -camY);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const v = world[y][x];
          if (!v) continue;
          const px = x * TILE;
          const py = y * TILE;
          ctx.fillStyle = COLORS[v];
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "rgba(255,255,255,0.10)";
          ctx.fillRect(px, py, TILE, 5);
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(px, py + TILE - 5, TILE, 5);
          if (v === 4 || v === 5) {
            ctx.save();
            ctx.shadowColor = COLORS[v];
            ctx.shadowBlur = 18;
            ctx.fillStyle = v === 4 ? "#FFE3A8" : "#B8F4FF";
            ctx.fillRect(px + 12, py + 12, 9, 9);
            ctx.fillRect(px + 22, py + 22, 7, 7);
            ctx.restore();
          }
        }
      }
      ctx.restore();

      // toolbar
      const bar = [1, 2, 3, 5];
      bar.forEach((b, i) => {
        const bx = 24 + i * 54;
        ctx.fillStyle = b === selected ? "rgba(124,58,237,0.55)" : "rgba(20,20,32,0.85)";
        ctx.fillRect(bx, VH - 70, 46, 46);
        ctx.strokeStyle = b === selected ? "#A78BFA" : "#24243a";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, VH - 70, 46, 46);
        ctx.fillStyle = COLORS[b];
        ctx.fillRect(bx + 11, VH - 59, 24, 24);
        ctx.font = '600 10px "Chakra Petch", system-ui, sans-serif';
        ctx.fillStyle = "#9A9AB8";
        ctx.fillText(String(i === 3 ? 5 : b), bx + 20, VH - 80);
      });

      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(`ORE SCORE ${score}`, VW - 24, 40);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* MAZE — Haunted Corridor / Dungeon Dash                              */
/* ------------------------------------------------------------------ */
export const maze: EngineFactory = (canvas, api, config) => {
  const hunters = Number(config.hunters ?? 1);
  const CELL = 40;
  const GW = 23;
  const GH = 15;

  let grid: number[][] = [];
  let player = { x: 1, y: 1 };
  let foes: { x: number; y: number; timer: number }[] = [];
  let items: { x: number; y: number }[] = [];
  let exit = { x: GW - 2, y: GH - 2 };
  let score = 0;
  let over = false;
  let won = false;
  let moveCd = 0;
  let message = "";

  const carve = () => {
    grid = Array.from({ length: GH }, () => Array(GW).fill(1));
    const stack: [number, number][] = [[1, 1]];
    grid[1][1] = 0;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const dirs = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ].sort(() => Math.random() - 0.5);
      let moved = false;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && ny > 0 && nx < GW - 1 && ny < GH - 1 && grid[ny][nx] === 1) {
          grid[y + dy / 2][x + dx / 2] = 0;
          grid[ny][nx] = 0;
          stack.push([nx, ny]);
          moved = true;
          break;
        }
      }
      if (!moved) stack.pop();
    }
  };

  const reset = () => {
    carve();
    player = { x: 1, y: 1 };
    exit = { x: GW - 2, y: GH - 2 };
    const open: [number, number][] = [];
    for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) if (grid[y][x] === 0) open.push([x, y]);
    const shuffled = open.sort(() => Math.random() - 0.5);
    items = shuffled.slice(0, 8).map(([x, y]) => ({ x, y }));
    foes = shuffled.slice(8, 8 + hunters).map(([x, y]) => ({ x, y, timer: 0 }));
    score = 0;
    over = false;
    won = false;
    moveCd = 0;
    message = hunters > 1 ? "Collect every relic, then reach the exit" : "Collect the fuse cells. Stay in the dark.";
    api.setScore(0);
    api.setStatus(message);
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      moveCd -= dt;
      if (moveCd <= 0) {
        let dx = 0;
        let dy = 0;
        if (input.down("arrowup", "w")) dy = -1;
        else if (input.down("arrowdown", "s")) dy = 1;
        else if (input.down("arrowleft", "a")) dx = -1;
        else if (input.down("arrowright", "d")) dx = 1;
        if (input.pointer.down) {
          const px = Math.floor((input.pointer.x - VW / 2 + (player.x + 0.5) * CELL) / CELL) - player.x;
          const py = Math.floor((input.pointer.y - VH / 2 + (player.y + 0.5) * CELL) / CELL) - player.y;
          if (Math.abs(px) > Math.abs(py)) dx = Math.sign(px);
          else dy = Math.sign(py);
        }
        if ((dx || dy) && grid[player.y + dy]?.[player.x + dx] === 0) {
          player.x += dx;
          player.y += dy;
          moveCd = 0.11;
          blip.play(150, 0.03, "triangle", 0.022);
          const idx = items.findIndex((i) => i.x === player.x && i.y === player.y);
          if (idx >= 0) {
            items.splice(idx, 1);
            score += 120;
            api.setScore(score);
            blip.play(760, 0.12, "triangle", 0.05);
            api.setStatus(items.length ? `${items.length} remaining` : "Exit unlocked — get out");
          }
          if (!items.length && player.x === exit.x && player.y === exit.y && !won) {
            won = true;
            over = true;
            score += 800;
            api.setScore(score);
            blip.sweep(300, 1100, 0.5);
            api.onOver({ score, stats: { relics: 8 } });
            api.setStatus("Escaped");
          }
        }
      }

      for (const f of foes) {
        f.timer -= dt;
        if (f.timer <= 0) {
          f.timer = hunters > 1 ? 0.34 : 0.26;
          const options = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
          ].filter(([dx, dy]) => grid[f.y + dy]?.[f.x + dx] === 0);
          options.sort((a, b) => {
            const da = Math.abs(f.x + a[0] - player.x) + Math.abs(f.y + a[1] - player.y);
            const db = Math.abs(f.x + b[0] - player.x) + Math.abs(f.y + b[1] - player.y);
            return da - db;
          });
          const pickMove = Math.random() < 0.78 ? options[0] : options[Math.floor(Math.random() * options.length)];
          if (pickMove) {
            f.x += pickMove[0];
            f.y += pickMove[1];
          }
          if (f.x === player.x && f.y === player.y && !over) {
            over = true;
            blip.sweep(280, 50, 0.7);
            api.onOver({ score, stats: { relics: 8 - items.length } });
            api.setStatus("Caught");
          }
        }
      }

      // render
      stage.clear("#06060d");
      const ox = VW / 2 - (player.x + 0.5) * CELL;
      const oy = VH / 2 - (player.y + 0.5) * CELL;
      ctx.save();
      ctx.translate(ox, oy);
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const px = x * CELL;
          const py = y * CELL;
          if (grid[y][x] === 1) {
            ctx.fillStyle = hunters > 1 ? "#20203c" : "#1a1428";
            ctx.fillRect(px, py, CELL, CELL);
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.fillRect(px, py, CELL, 3);
          } else {
            ctx.fillStyle = hunters > 1 ? "#12122a" : "#0f0c1c";
            ctx.fillRect(px, py, CELL, CELL);
          }
        }
      }
      // exit
      if (!items.length) {
        ctx.save();
        ctx.shadowColor = "#34D399";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#34D399";
        ctx.fillRect(exit.x * CELL + 6, exit.y * CELL + 6, CELL - 12, CELL - 12);
        ctx.restore();
      }
      for (const it of items) {
        ctx.save();
        ctx.shadowColor = hunters > 1 ? "#22D3EE" : "#FFB020";
        ctx.shadowBlur = 22;
        ctx.fillStyle = hunters > 1 ? "#67E8F9" : "#FFB020";
        ctx.beginPath();
        ctx.arc(it.x * CELL + CELL / 2, it.y * CELL + CELL / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const f of foes) {
        ctx.save();
        ctx.shadowColor = "#F43F5E";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#F43F5E";
        ctx.fillRect(f.x * CELL + 7, f.y * CELL + 7, CELL - 14, CELL - 14);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = "#A78BFA";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#C4B5FD";
      ctx.fillRect(player.x * CELL + 8, player.y * CELL + 8, CELL - 16, CELL - 16);
      ctx.restore();
      ctx.restore();

      // darkness / light cone
      if (hunters <= 1) {
        const px = VW / 2;
        const py = VH / 2;
        const g = ctx.createRadialGradient(px, py, 40, px, py, 260);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.55, "rgba(0,0,0,0.55)");
        g.addColorStop(1, "rgba(0,0,0,0.93)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VW, VH);
      }

      panelGrid(ctx, VW, VH, 80, "rgba(124,58,237,0.06)");
      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(hunters > 1 ? `RELICS LEFT ${items.length}` : `FUSE CELLS ${8 - items.length}/8`, 24, 40);
      if (over) drawOver(ctx, VW, VH, won ? "ESCAPED" : "CAUGHT", score);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* SPORTS — Penalty Pro / Hoop Shot                                    */
/* ------------------------------------------------------------------ */
export const sports: EngineFactory = (canvas, api, config) => {
  const penalty = config.mode !== "hoop";
  const rounds = Number(config.rounds ?? 5);

  let score = 0;
  let round = 0;
  let over = false;
  let aim = 0;
  let meter = 0;
  let meterDir = 1;
  let keeperDir = 0;
  let shotResult: string | null = null;
  let resultTimer = 0;
  let history: number[] = [];

  const reset = () => {
    score = 0;
    round = 0;
    over = false;
    aim = 0;
    meter = 0;
    meterDir = 1;
    keeperDir = 0;
    shotResult = null;
    resultTimer = 0;
    history = [];
    api.setScore(0);
    api.setStatus(penalty ? "Aim with the cursor · click to shoot" : "Release when the meter hits the green band");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      meter += meterDir * dt * (penalty ? 1.6 : 1.15);
      if (meter > 1) {
        meter = 1;
        meterDir = -1;
      }
      if (meter < 0) {
        meter = 0;
        meterDir = 1;
      }
      if (input.pointer.active) aim = clamp((input.pointer.x - VW / 2) / (VW * 0.36), -1, 1);
      if (input.down("arrowleft", "a")) aim = clamp(aim - dt * 1.6, -1, 1);
      if (input.down("arrowright", "d")) aim = clamp(aim + dt * 1.6, -1, 1);

      const shoot = input.pointer.justDown || input.hit(" ", "enter");
      if (shoot && !shotResult && !over) {
        round++;
        if (penalty) {
          const predict = history.length ? history[history.length - 1] : Math.random() * 2 - 1;
          keeperDir = Math.random() < 0.55 ? predict : Math.random() * 2 - 1;
          const miss = Math.abs(aim - keeperDir) < 0.34 || Math.abs(aim) > 0.97;
          history.push(aim);
          if (miss) {
            shotResult = "SAVED";
            blip.sweep(300, 90, 0.3);
          } else {
            const precision = 1 - Math.abs(Math.abs(aim) - 0.72);
            const points = Math.round(220 + precision * 380 + meter * 260);
            score += points;
            shotResult = `GOAL +${points}`;
            api.setScore(score);
            blip.sweep(420, 1200, 0.35);
          }
        } else {
          const target = 0.5;
          const diff = Math.abs(meter - target);
          const swish = diff < 0.075;
          const good = diff < 0.17;
          if (swish) {
            score += 300;
            shotResult = "SWISH +300";
            blip.sweep(500, 1300, 0.3);
          } else if (good) {
            score += 120;
            shotResult = "SCORES +120";
            blip.play(640, 0.14);
          } else {
            shotResult = "CLANG";
            blip.sweep(220, 80, 0.3);
          }
          api.setScore(score);
        }
        resultTimer = 1.1;
      }
      if (shotResult) {
        resultTimer -= dt;
        if (resultTimer <= 0) {
          shotResult = null;
          if (round >= rounds && !over) {
            over = true;
            score += 500;
            api.setScore(score);
            api.onOver({ score, stats: { rounds } });
            api.setStatus("Full time");
          }
        }
      }

      // render
      stage.clear("#07070f");
      const sky = ctx.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, "#241a4d");
      sky.addColorStop(1, "#0b0b18");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VW, VH);
      panelGrid(ctx, VW, VH, 60, "rgba(124,58,237,0.09)");

      if (penalty) {
        // goal frame
        ctx.strokeStyle = "#E9E6FF";
        ctx.lineWidth = 12;
        ctx.strokeRect(VW / 2 - 320, 120, 640, 260);
        ctx.strokeStyle = "rgba(167,139,250,0.28)";
        ctx.lineWidth = 2;
        for (let i = 0; i <= 12; i++) {
          ctx.beginPath();
          ctx.moveTo(VW / 2 - 320 + i * 53, 120);
          ctx.lineTo(VW / 2 - 320 + i * 53, 380);
          ctx.stroke();
        }
        for (let i = 0; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(VW / 2 - 320, 120 + i * 52);
          ctx.lineTo(VW / 2 + 320, 120 + i * 52);
          ctx.stroke();
        }
        // keeper
        const kx = VW / 2 + keeperDir * 260;
        ctx.save();
        ctx.shadowColor = "#22D3EE";
        ctx.shadowBlur = 26;
        ctx.fillStyle = "#22D3EE";
        ctx.fillRect(kx - 34, 220, 68, 130);
        ctx.restore();
        // ball + aim arc
        ctx.save();
        ctx.shadowColor = "#FFB020";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFE3A8";
        ctx.beginPath();
        ctx.arc(VW / 2 + aim * 300, 470, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "rgba(255,176,32,0.5)";
        ctx.setLineDash([10, 12]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(VW / 2 + aim * 300, 440);
        ctx.lineTo(VW / 2 + aim * 300, 180);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // hoop
        const hx = VW / 2 + Math.sin(performance.now() / 900) * 260;
        ctx.strokeStyle = "#FFB020";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(hx, 300, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,176,32,0.16)";
        ctx.fillRect(hx - 90, 300, 180, 150);
        ctx.save();
        ctx.shadowColor = "#FFB020";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "#FFE3A8";
        ctx.beginPath();
        ctx.arc(VW / 2 + aim * 300, 500, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // meter
      const mx = VW / 2 - 260;
      const my = VH - 88;
      ctx.fillStyle = "rgba(20,20,32,0.9)";
      ctx.fillRect(mx, my, 520, 22);
      ctx.fillStyle = "#34D399";
      ctx.fillRect(mx + 520 * (penalty ? 0.62 : 0.42), my, penalty ? 60 : 32, 22);
      ctx.fillStyle = "#A78BFA";
      ctx.fillRect(mx + meter * 512, my - 6, 8, 34);
      ctx.font = '600 12px "Chakra Petch", system-ui, sans-serif';
      ctx.fillStyle = "#9A9AB8";
      ctx.fillText(penalty ? "SHOT POWER" : "RELEASE TIMING", mx, my - 16);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(`ROUND ${Math.min(round + 1, rounds)}/${rounds}`, VW - 24, 40);
      ctx.textAlign = "left";

      if (shotResult) glowText(ctx, shotResult, VW / 2, 220, shotResult.startsWith("GOAL") || shotResult.startsWith("SWISH") || shotResult.startsWith("SCORES") ? "#34D399" : "#F43F5E", 52);
      if (over) drawOver(ctx, VW, VH, "FULL TIME", score, "Press R for another match");
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

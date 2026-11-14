import {
  beginGame,
  blip,
  clamp,
  drawOver,
  glowText,
  panelGrid,
  rand,
  VH,
  VW,
  type EngineFactory,
} from "./kit";

/* ------------------------------------------------------------------ */
/* NEON SNAKE                                                          */
/* ------------------------------------------------------------------ */
export const snake: EngineFactory = (canvas, api) => {
  const CELL = 30;
  const COLS = VW / CELL;
  const ROWS = VH / CELL;
  let body: { x: number; y: number }[] = [];
  let dir = { x: 1, y: 0 };
  let next = { x: 1, y: 0 };
  let food = { x: 10, y: 10 };
  let score = 0;
  let chain = 1;
  let speed = 7;
  let acc = 0;
  let over = false;
  let started = false;
  let swipe: { x: number; y: number } | null = null;

  const placeFood = () => {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (body.some((s) => s.x === food.x && s.y === food.y));
  };

  const reset = () => {
    body = Array.from({ length: 5 }, (_, i) => ({ x: 8 - i, y: 10 }));
    dir = { x: 1, y: 0 };
    next = { x: 1, y: 0 };
    score = 0;
    chain = 1;
    speed = 7;
    acc = 0;
    over = false;
    started = false;
    placeFood();
    api.setScore(0);
    api.setStatus("Press any arrow key to start");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    const steer = (x: number, y: number) => {
      if (x === -dir.x && y === -dir.y) return;
      next = { x, y };
      started = true;
      api.setStatus("Multiplier x" + chain);
    };

    tick((dt) => {
      if (input.hit("arrowup", "w")) steer(0, -1);
      else if (input.hit("arrowdown", "s")) steer(0, 1);
      else if (input.hit("arrowleft", "a")) steer(-1, 0);
      else if (input.hit("arrowright", "d")) steer(1, 0);

      if (input.pointer.justDown) swipe = { x: input.pointer.x, y: input.pointer.y };
      if (input.pointer.justUp && swipe) {
        const dx = input.pointer.x - swipe.x;
        const dy = input.pointer.y - swipe.y;
        if (Math.abs(dx) > Math.abs(dy)) steer(Math.sign(dx), 0);
        else steer(0, Math.sign(dy));
        swipe = null;
      }
      if (over && (input.hit("r", " ") || input.pointer.justDown)) {
        reset();
        return;
      }

      if (!started || over) {
        stage.clear("#07070f");
        panelGrid(ctx, VW, VH);
        drawBoard();
        return;
      }

      acc += dt;
      const interval = 1 / speed;
      if (acc < interval) {
        stage.clear("#07070f");
        panelGrid(ctx, VW, VH);
        drawBoard();
        return;
      }
      acc = 0;
      dir = next;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };

      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || body.some((s) => s.x === head.x && s.y === head.y)) {
        over = true;
        blip.sweep(240, 60, 0.5);
        api.onOver({ score, stats: { length: body.length, multiplier: chain } });
        api.setStatus("Signal lost");
        return;
      }

      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 25 * chain;
        chain = Math.min(12, chain + 1);
        speed = Math.min(22, speed + 0.45);
        blip.play(520 + chain * 40, 0.07);
        placeFood();
        api.setScore(score);
        api.setStatus("Multiplier x" + chain);
      } else {
        body.pop();
      }

      stage.clear("#07070f");
      panelGrid(ctx, VW, VH);
      drawBoard();
    });

    function drawBoard() {
      const pulse = 0.6 + Math.sin(performance.now() / 220) * 0.4;
      ctx.save();
      ctx.shadowColor = "#FFB020";
      ctx.shadowBlur = 26 * pulse;
      ctx.fillStyle = "#FFB020";
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      body.forEach((s, i) => {
        const t = 1 - i / body.length;
        ctx.save();
        ctx.shadowColor = i === 0 ? "#22D3EE" : "#7C3AED";
        ctx.shadowBlur = i === 0 ? 26 : 14;
        ctx.fillStyle = i === 0 ? "#67E8F9" : `rgba(124,58,237,${0.42 + t * 0.5})`;
        const pad = i === 0 ? 2 : 3.5;
        ctx.fillRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
        ctx.restore();
      });

      if (over) drawOver(ctx, VW, VH, "GAME OVER", score);
      else if (!started) {
        glowText(ctx, "NEON SNAKE", VW / 2, VH / 2 - 30, "#22D3EE", 58);
        ctx.font = '500 17px "Space Grotesk", system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#9A9AB8";
        ctx.fillText("Arrow keys / WASD / swipe to steer", VW / 2, VH / 2 + 28);
      }
    }

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* BRICK BREAKER                                                       */
/* ------------------------------------------------------------------ */
export const breakout: EngineFactory = (canvas, api, config) => {
  const startLives = Number(config.lives ?? 3);
  const startRows = Number(config.rows ?? 6);
  let paddle = { x: VW / 2 - 80, w: 160, y: VH - 62, h: 16 };
  let balls: { x: number; y: number; vx: number; vy: number }[] = [];
  let bricks: { x: number; y: number; w: number; h: number; hp: number; hue: string }[] = [];
  let drops: { x: number; y: number; kind: string }[] = [];
  let lives = startLives;
  let score = 0;
  let level = 1;
  let over = false;
  let launched = false;
  let wideTimer = 0;

  const buildBricks = (rows: number) => {
    bricks = [];
    const cols = 12;
    const gap = 8;
    const bw = (VW - 120 - gap * (cols - 1)) / cols;
    const hues = ["#7C3AED", "#A78BFA", "#22D3EE", "#FFB020", "#F43F5E"];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: 60 + c * (bw + gap),
          y: 84 + r * 34,
          w: bw,
          h: 24,
          hp: r < 2 ? 2 : 1,
          hue: hues[r % hues.length],
        });
      }
    }
  };

  const serve = () => {
    balls = [{ x: paddle.x + paddle.w / 2, y: paddle.y - 14, vx: rand(-220, 220), vy: -430 }];
    launched = false;
  };

  const reset = () => {
    lives = startLives;
    score = 0;
    level = 1;
    over = false;
    wideTimer = 0;
    drops = [];
    paddle = { x: VW / 2 - 80, w: 160, y: VH - 62, h: 16 };
    buildBricks(startRows);
    serve();
    api.setScore(0);
    api.setStatus("Move the paddle — click to launch");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();
      if (input.hit("p")) api.paused = !api.paused;

      const speed = 620;
      if (input.down("arrowleft", "a")) paddle.x -= speed * dt;
      if (input.down("arrowright", "d")) paddle.x += speed * dt;
      if (input.pointer.active) paddle.x = input.pointer.x - paddle.w / 2;
      paddle.x = clamp(paddle.x, 8, VW - paddle.w - 8);

      if (!launched && (input.hit(" ") || input.pointer.justDown)) {
        launched = true;
        blip.play(420, 0.06);
      }
      if (!launched) {
        const b = balls[0];
        b.x = paddle.x + paddle.w / 2;
        b.y = paddle.y - 16;
      }

      if (wideTimer > 0) {
        wideTimer -= dt;
        if (wideTimer <= 0) paddle.w = 160;
      }

      for (const b of balls) {
        if (!launched) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 10) {
          b.x = 10;
          b.vx = Math.abs(b.vx);
          blip.play(180, 0.03);
        }
        if (b.x > VW - 10) {
          b.x = VW - 10;
          b.vx = -Math.abs(b.vx);
          blip.play(180, 0.03);
        }
        if (b.y < 10) {
          b.y = 10;
          b.vy = Math.abs(b.vy);
          blip.play(180, 0.03);
        }
        if (b.y > paddle.y - 10 && b.y < paddle.y + 20 && b.vy > 0 && b.x > paddle.x && b.x < paddle.x + paddle.w) {
          const hit = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const angle = hit * 1.05;
          const vel = Math.min(760, Math.hypot(b.vx, b.vy) * 1.015);
          b.vx = Math.sin(angle) * vel;
          b.vy = -Math.cos(angle) * vel;
          b.y = paddle.y - 12;
          blip.play(300 + Math.abs(hit) * 200, 0.05);
        }
        for (const br of bricks) {
          if (br.hp <= 0) continue;
          if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
            br.hp -= 1;
            b.vy = -b.vy;
            score += 25;
            api.setScore(score);
            if (br.hp <= 0) {
              score += 60;
              blip.play(620, 0.05);
              if (Math.random() < 0.16) {
                drops.push({
                  x: br.x + br.w / 2,
                  y: br.y,
                  kind: ["wide", "life", "multi"][Math.floor(Math.random() * 3)],
                });
              }
            } else blip.play(420, 0.04);
            break;
          }
        }
      }

      balls = balls.filter((b) => b.y < VH + 40);
      if (balls.length === 0) {
        lives -= 1;
        if (lives <= 0) {
          over = true;
          blip.sweep(300, 70, 0.5);
          api.onOver({ score, stats: { level, lives: 0 } });
          api.setStatus("Out of shields");
        } else {
          serve();
          api.setStatus(`${lives} shields remaining`);
        }
      }

      for (const d of drops) d.y += 190 * dt;
      drops = drops.filter((d) => {
        if (d.y > paddle.y - 12 && d.y < paddle.y + 26 && d.x > paddle.x && d.x < paddle.x + paddle.w) {
          blip.play(760, 0.09);
          if (d.kind === "wide") {
            paddle.w = 250;
            wideTimer = 14;
          } else if (d.kind === "life") lives += 1;
          else balls.push({ x: paddle.x + paddle.w / 2, y: paddle.y - 16, vx: rand(-260, 260), vy: -460 });
          score += 120;
          api.setScore(score);
          return false;
        }
        return d.y < VH + 20;
      });

      if (bricks.every((b) => b.hp <= 0)) {
        level += 1;
        score += 500;
        api.setScore(score);
        buildBricks(Math.min(9, startRows + level - 1));
        serve();
        blip.sweep(300, 900, 0.4);
        api.setStatus(`Wave ${level} cleared — bonus 500`);
      }

      // ---- render
      stage.clear("#07070f");
      panelGrid(ctx, VW, VH);
      for (const br of bricks) {
        if (br.hp <= 0) continue;
        ctx.save();
        ctx.shadowColor = br.hue;
        ctx.shadowBlur = 16;
        ctx.fillStyle = br.hp > 1 ? br.hue : br.hue;
        ctx.globalAlpha = br.hp > 1 ? 0.95 : 0.72;
        ctx.fillRect(br.x, br.y, br.w, br.h);
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(br.x, br.y, br.w, 4);
      }
      for (const d of drops) {
        ctx.save();
        ctx.shadowColor = d.kind === "life" ? "#34D399" : "#22D3EE";
        ctx.shadowBlur = 18;
        ctx.fillStyle = d.kind === "life" ? "#34D399" : d.kind === "wide" ? "#22D3EE" : "#A78BFA";
        ctx.fillRect(d.x - 14, d.y - 9, 28, 18);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = "#7C3AED";
      ctx.shadowBlur = 22;
      const grad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
      grad.addColorStop(0, "#7C3AED");
      grad.addColorStop(1, "#22D3EE");
      ctx.fillStyle = grad;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.restore();
      for (const b of balls) {
        ctx.save();
        ctx.shadowColor = "#FFB020";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#FFE0A3";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#9A9AB8";
      ctx.fillText(`SHIELDS ${lives}`, 24, 40);
      ctx.textAlign = "right";
      ctx.fillText(`WAVE ${level}`, VW - 24, 40);
      if (over) drawOver(ctx, VW, VH, "GAME OVER", score);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* BLOCKFALL (falling blocks)                                          */
/* ------------------------------------------------------------------ */
const TETRO = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
];
const TETRO_COLORS = ["#22D3EE", "#FFB020", "#A78BFA", "#7C3AED", "#F43F5E", "#34D399", "#FB923C"];

export const blocks: EngineFactory = (canvas, api, config) => {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 27;
  const OX = VW / 2 - (COLS * CELL) / 2;
  const OY = 52;
  const blitz = config.mode === "blitz";

  let grid: (number | null)[][];
  let piece: { m: number[][]; x: number; y: number; c: number };
  let nextPiece: { m: number[][]; c: number };
  let score = 0;
  let lines = 0;
  let level = 1;
  let over = false;
  let fallAcc = 0;
  let dropDelay = blitz ? 0.32 : 0.85;

  const randPiece = () => {
    const i = Math.floor(Math.random() * TETRO.length);
    return { m: TETRO[i].map((r) => [...r]), c: i };
  };

  const spawn = () => {
    piece = { m: nextPiece.m, x: Math.floor(COLS / 2) - Math.ceil(nextPiece.m[0].length / 2), y: 0, c: nextPiece.c };
    nextPiece = randPiece();
    if (collides(piece.m, piece.x, piece.y)) {
      over = true;
      blip.sweep(320, 60, 0.6);
      api.onOver({ score, stats: { lines, level } });
      api.setStatus("Stack overflow");
    }
  };

  const collides = (m: number[][], px: number, py: number) =>
    m.some((row, r) => row.some((v, c) => v && (px + c < 0 || px + c >= COLS || py + r >= ROWS || (py + r >= 0 && grid[py + r][px + c] !== null))));

  const merge = () => {
    piece.m.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v && piece.y + r >= 0) grid[piece.y + r][piece.x + c] = piece.c;
      })
    );
  };

  const clearLines = () => {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((v) => v !== null)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      const table = [0, 100, 300, 500, 800];
      score += table[cleared] * level;
      lines += cleared;
      level = 1 + Math.floor(lines / (blitz ? 6 : 10));
      dropDelay = Math.max(0.09, (blitz ? 0.32 : 0.85) * Math.pow(0.86, level - 1));
      api.setScore(score);
      api.setStatus(`${lines} lines · level ${level}`);
      blip.sweep(200 + cleared * 120, 900, 0.22);
    }
  };

  const rotate = () => {
    const m = piece.m[0].map((_, i) => piece.m.map((row) => row[i]).reverse());
    if (!collides(m, piece.x, piece.y)) piece.m = m;
    else if (!collides(m, piece.x - 1, piece.y)) {
      piece.m = m;
      piece.x -= 1;
    } else if (!collides(m, piece.x + 1, piece.y)) {
      piece.m = m;
      piece.x += 1;
    }
  };

  const reset = () => {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    score = 0;
    lines = 0;
    level = 1;
    over = false;
    fallAcc = 0;
    dropDelay = blitz ? 0.32 : 0.85;
    nextPiece = randPiece();
    spawn();
    api.setScore(0);
    api.setStatus("Arrow keys to move · space to drop");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      if (input.hit("arrowleft", "a") && !collides(piece.m, piece.x - 1, piece.y)) piece.x -= 1;
      if (input.hit("arrowright", "d") && !collides(piece.m, piece.x + 1, piece.y)) piece.x += 1;
      if (input.hit("arrowup", "w", "x")) rotate();
      const fast = input.down("arrowdown", "s");
      if (input.hit(" ")) {
        while (!collides(piece.m, piece.x, piece.y + 1)) piece.y += 1;
        merge();
        clearLines();
        spawn();
        blip.play(180, 0.07);
      }

      fallAcc += dt * (fast ? 9 : 1);
      if (fallAcc >= dropDelay) {
        fallAcc = 0;
        if (!collides(piece.m, piece.x, piece.y + 1)) piece.y += 1;
        else {
          merge();
          clearLines();
          spawn();
        }
      }

      // render
      stage.clear("#07070f");
      ctx.fillStyle = "#0b0c17";
      ctx.fillRect(OX - 14, OY - 14, COLS * CELL + 28, ROWS * CELL + 28);
      ctx.strokeStyle = "#24243a";
      ctx.lineWidth = 2;
      ctx.strokeRect(OX - 14, OY - 14, COLS * CELL + 28, ROWS * CELL + 28);
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          ctx.strokeStyle = "rgba(124,58,237,0.10)";
          ctx.strokeRect(OX + c * CELL, OY + r * CELL, CELL, CELL);
          const v = grid[r][c];
          if (v !== null) drawCell(ctx, OX + c * CELL, OY + r * CELL, CELL, TETRO_COLORS[v]);
        }
      if (!over) {
        // ghost
        let gy = piece.y;
        while (!collides(piece.m, piece.x, gy + 1)) gy++;
        piece.m.forEach((row, r) =>
          row.forEach((v, c) => {
            if (!v) return;
            ctx.strokeStyle = "rgba(167,139,250,0.35)";
            ctx.strokeRect(OX + (piece.x + c) * CELL + 3, OY + (gy + r) * CELL + 3, CELL - 6, CELL - 6);
          })
        );
        piece.m.forEach((row, r) =>
          row.forEach((v, c) => v && drawCell(ctx, OX + (piece.x + c) * CELL, OY + (piece.y + r) * CELL, CELL, TETRO_COLORS[piece.c]))
        );
      }
      // next preview
      ctx.font = '600 12px "Chakra Petch", system-ui, sans-serif';
      ctx.fillStyle = "#6f6f8c";
      ctx.textAlign = "left";
      ctx.fillText("NEXT", OX + COLS * CELL + 44, OY + 16);
      nextPiece.m.forEach((row, r) =>
        row.forEach((v, c) => v && drawCell(ctx, OX + COLS * CELL + 44 + c * 22, OY + 34 + r * 22, 22, TETRO_COLORS[nextPiece.c]))
      );
      ctx.fillStyle = "#6f6f8c";
      ctx.fillText("LINES", OX + COLS * CELL + 44, OY + 150);
      glowText(ctx, String(lines), OX + COLS * CELL + 44, OY + 178, "#FFB020", 30, "left", 12);
      ctx.fillStyle = "#6f6f8c";
      ctx.fillText("LEVEL", OX + COLS * CELL + 44, OY + 226);
      glowText(ctx, String(level), OX + COLS * CELL + 44, OY + 254, "#22D3EE", 30, "left", 12);

      if (over) drawOver(ctx, VW, VH, "STACK OVERFLOW", score);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x + 2, y + 2, s - 4, 4);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x + 2, y + s - 6, s - 4, 4);
}

/* ------------------------------------------------------------------ */
/* MEMORY MATRIX / SIMON PULSE                                         */
/* ------------------------------------------------------------------ */
export const memory: EngineFactory = (canvas, api, config) => {
  const N = Number(config.grid ?? 3);
  const tiles = N * N;
  const SIZE = 300;
  const OX = VW / 2 - SIZE / 2;
  const OY = VH / 2 - SIZE / 2 + 10;
  const pad = 12;
  const cell = (SIZE - pad * (N + 1)) / N;

  let seq: number[] = [];
  let step = 0;
  let phase: "show" | "input" | "fail" = "show";
  let flash = -1;
  let timer = 0;
  let showIdx = 0;
  let score = 0;
  let over = false;

  const colors = N === 2 ? ["#7C3AED", "#22D3EE", "#FFB020", "#F43F5E"] : [];

  const nextRound = () => {
    seq.push(Math.floor(Math.random() * tiles));
    step = 0;
    showIdx = 0;
    phase = "show";
    timer = 0.45;
    flash = -1;
    api.setStatus(`Round ${seq.length} · watch`);
  };

  const reset = () => {
    seq = [];
    score = 0;
    over = false;
    nextRound();
    api.setScore(0);
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      if (phase === "show") {
        timer -= dt;
        if (timer <= 0) {
          if (flash >= 0) {
            flash = -1;
            timer = 0.18;
          } else if (showIdx < seq.length) {
            flash = seq[showIdx++];
            timer = 0.52;
            blip.play(320 + flash * 60, 0.1);
          } else {
            phase = "input";
            api.setStatus("Your turn");
          }
        }
      } else if (phase === "input") {
        let clicked = -1;
        if (input.pointer.justDown) {
          for (let i = 0; i < tiles; i++) {
            const cx = OX + pad + (i % N) * (cell + pad);
            const cy = OY + pad + Math.floor(i / N) * (cell + pad);
            if (input.pointer.x > cx && input.pointer.x < cx + cell && input.pointer.y > cy && input.pointer.y < cy + cell) clicked = i;
          }
        }
        for (let i = 0; i < tiles; i++) if (input.hit(String(i + 1))) clicked = i;
        if (clicked >= 0) {
          flash = clicked;
          setTimeout(() => (flash = -1), 160);
          if (clicked === seq[step]) {
            blip.play(420 + step * 40, 0.09);
            step++;
            if (step >= seq.length) {
              score += 100 * seq.length;
              api.setScore(score);
              blip.sweep(400, 1000, 0.3);
              phase = "show";
              setTimeout(nextRound, 420);
            }
          } else {
            over = true;
            blip.sweep(300, 60, 0.55);
            api.onOver({ score, stats: { rounds: seq.length - 1 } });
            api.setStatus("Sequence broken");
          }
        }
      }

      // render
      stage.clear("#07070f");
      panelGrid(ctx, VW, VH);
      for (let i = 0; i < tiles; i++) {
        const cx = OX + pad + (i % N) * (cell + pad);
        const cy = OY + pad + Math.floor(i / N) * (cell + pad);
        const base = N === 2 ? colors[i] : "#7C3AED";
        const lit = flash === i;
        ctx.save();
        ctx.shadowColor = base;
        ctx.shadowBlur = lit ? 46 : 10;
        ctx.fillStyle = lit ? base : "rgba(124,58,237,0.20)";
        ctx.fillRect(cx, cy, cell, cell);
        ctx.restore();
        ctx.strokeStyle = lit ? "#fff" : "rgba(167,139,250,0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 1, cy + 1, cell - 2, cell - 2);
      }
      glowText(ctx, `ROUND ${Math.max(1, seq.length)}`, VW / 2, 60, "#A78BFA", 26);
      if (over) drawOver(ctx, VW, VH, "SEQUENCE BROKEN", score);
    });

    return {
      destroy() {},
      pause() {},
      resume() {},
      restart: reset,
    };
  });
};

/* ------------------------------------------------------------------ */
/* GRID DUEL (tic-tac-toe, minimax or local)                           */
/* ------------------------------------------------------------------ */
export const duel: EngineFactory = (canvas, api, config) => {
  const local = config.ai === "local";
  const SIZE = 380;
  const OX = VW / 2 - SIZE / 2;
  const OY = VH / 2 - SIZE / 2 + 20;
  const cell = SIZE / 3;

  let board: (null | "x" | "o")[] = Array(9).fill(null);
  let turn: "x" | "o" = "x";
  let score = 0;
  let over = false;
  let winner: null | "x" | "o" | "draw" = null;
  let streak = 0;
  let aiTimer = 0;

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const evaluate = (b: (null | "x" | "o")[]) => {
    for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] === "o" ? 1 : -1;
    return b.every(Boolean) ? 0 : null;
  };
  const minimax = (b: (null | "x" | "o")[], player: "x" | "o"): number => {
    const res = evaluate(b);
    if (res !== null) return res;
    const scores: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = player;
      scores.push(minimax(b, player === "o" ? "x" : "o"));
      b[i] = null;
    }
    return player === "o" ? Math.max(...scores) : Math.min(...scores);
  };
  const aiMove = () => {
    let best = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = "o";
      const s = minimax(board, "x");
      board[i] = null;
      if (s > best) {
        best = s;
        move = i;
      }
    }
    return move;
  };

  const check = () => {
    const res = evaluate(board);
    if (res === null) return false;
    winner = res === 0 ? "draw" : res === 1 ? "o" : "x";
    over = true;
    if (winner === "x" && !local) {
      streak += 1;
      score += 500 * streak;
      blip.sweep(400, 1100, 0.4);
    } else if (winner === "draw") {
      score += 150;
      blip.play(420, 0.16);
    } else {
      streak = 0;
      blip.sweep(320, 70, 0.5);
    }
    api.setScore(score);
    api.onOver({ score, stats: { streak, result: winner === "draw" ? 0 : winner === "x" ? 1 : 2 } });
    api.setStatus(winner === "draw" ? "Draw — +150" : winner === "x" ? `Violet wins · streak x${streak}` : "Amber wins");
    return true;
  };

  const reset = () => {
    board = Array(9).fill(null);
    turn = "x";
    over = false;
    winner = null;
    aiTimer = 0;
    api.setStatus(local ? "Player 1 (violet) to move" : "Your move — violet");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (input.hit("r")) {
        reset();
        return;
      }
      if (!over && input.pointer.justDown) {
        const c = Math.floor((input.pointer.x - OX) / cell);
        const r = Math.floor((input.pointer.y - OY) / cell);
        if (c >= 0 && c < 3 && r >= 0 && r < 3) {
          const idx = r * 3 + c;
          if (!board[idx]) {
            board[idx] = turn;
            blip.play(turn === "x" ? 520 : 320, 0.1);
            if (!check()) {
              turn = turn === "x" ? "o" : "x";
              aiTimer = 0.45;
            }
          }
        }
      }
      if (!local && !over && turn === "o") {
        aiTimer -= dt;
        if (aiTimer <= 0) {
          const m = aiMove();
          if (m >= 0) board[m] = "o";
          blip.play(300, 0.1);
          if (!check()) turn = "x";
        }
      }

      stage.clear("#07070f");
      panelGrid(ctx, VW, VH);
      for (let i = 0; i <= 3; i++) {
        ctx.strokeStyle = "rgba(124,58,237,0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(OX + i * cell, OY);
        ctx.lineTo(OX + i * cell, OY + SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(OX, OY + i * cell);
        ctx.lineTo(OX + SIZE, OY + i * cell);
        ctx.stroke();
      }
      board.forEach((v, i) => {
        if (!v) return;
        const cx = OX + (i % 3) * cell + cell / 2;
        const cy = OY + Math.floor(i / 3) * cell + cell / 2;
        ctx.save();
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.shadowBlur = 30;
        if (v === "x") {
          ctx.strokeStyle = "#A78BFA";
          ctx.shadowColor = "#7C3AED";
          const s = cell * 0.26;
          ctx.beginPath();
          ctx.moveTo(cx - s, cy - s);
          ctx.lineTo(cx + s, cy + s);
          ctx.moveTo(cx + s, cy - s);
          ctx.lineTo(cx - s, cy + s);
          ctx.stroke();
        } else {
          ctx.strokeStyle = "#FFB020";
          ctx.shadowColor = "#FFB020";
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.27, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });
      glowText(ctx, local ? (turn === "x" ? "PLAYER 1" : "PLAYER 2") : turn === "x" ? "YOUR MOVE" : "CPU THINKING", VW / 2, 58, turn === "x" ? "#A78BFA" : "#FFB020", 26);
      if (over)
        drawOver(
          ctx,
          VW,
          VH,
          winner === "draw" ? "DRAW" : winner === "x" ? (local ? "PLAYER 1 WINS" : "YOU WIN") : local ? "PLAYER 2 WINS" : "CPU WINS",
          score,
          "Press R for a new board"
        );
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

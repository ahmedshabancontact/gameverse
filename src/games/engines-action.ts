import { beginGame, blip, clamp, drawOver, glowText, panelGrid, rand, VH, VW, type EngineFactory } from "./kit";

/* ------------------------------------------------------------------ */
/* SHOOTER — Space Blaster / Asteroid Siege                            */
/* ------------------------------------------------------------------ */
export const shooter: EngineFactory = (canvas, api, config) => {
  const asteroidMode = config.asteroids === true;
  const fireRate = Number(config.fireRate ?? 220) / 1000;

  type Rock = { x: number; y: number; vx: number; vy: number; r: number; hp: number };
  type Foe = { x: number; y: number; vx: number; vy: number; w: number; h: number; hp: number; kind: string; t: number };

  let player = { x: VW / 2, y: VH - 96, w: 54, h: 54 };
  let bullets: { x: number; y: number; vx: number; vy: number }[] = [];
  let foes: Foe[] = [];
  let rocks: Rock[] = [];
  let eBullets: { x: number; y: number; vx: number; vy: number }[] = [];
  let stars: { x: number; y: number; z: number }[] = [];
  let lives = 3;
  let score = 0;
  let wave = 1;
  let fireCd = 0;
  let spawnCd = 1.2;
  let over = false;
  let rapid = 0;
  let shake = 0;

  const seedStars = () =>
    Array.from({ length: 120 }, () => ({ x: Math.random() * VW, y: Math.random() * VH, z: Math.random() }));

  const spawnWave = () => {
    if (asteroidMode) {
      for (let i = 0; i < 3 + wave; i++)
        rocks.push({ x: rand(40, VW - 40), y: rand(-420, -40), vx: rand(-40, 40), vy: rand(90, 190) + wave * 12, r: rand(26, 52), hp: 3 });
    } else {
      const n = 3 + Math.min(6, wave);
      for (let i = 0; i < n; i++) {
        const kind = wave % 5 === 0 && i === 0 ? "boss" : Math.random() < 0.28 ? "ace" : "grunt";
        foes.push({
          x: 90 + (i / n) * (VW - 180),
          y: -60 - Math.random() * 220,
          vx: kind === "ace" ? rand(-160, 160) : 0,
          vy: kind === "boss" ? 40 : 80 + wave * 9,
          w: kind === "boss" ? 150 : 52,
          h: kind === "boss" ? 92 : 46,
          hp: kind === "boss" ? 22 + wave * 3 : kind === "ace" ? 3 : 1,
          kind,
          t: Math.random() * 10,
        });
      }
    }
  };

  const reset = () => {
    player = { x: VW / 2, y: VH - 96, w: 54, h: 54 };
    bullets = [];
    foes = [];
    rocks = [];
    eBullets = [];
    stars = seedStars();
    lives = 3;
    score = 0;
    wave = 1;
    fireCd = 0;
    spawnCd = 1;
    over = false;
    rapid = 0;
    shake = 0;
    api.setScore(0);
    api.setStatus("Hold Space to fire");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      const thrust = 460;
      if (input.down("arrowleft", "a")) player.x -= thrust * dt;
      if (input.down("arrowright", "d")) player.x += thrust * dt;
      if (input.down("arrowup", "w")) player.y -= thrust * dt;
      if (input.down("arrowdown", "s")) player.y += thrust * dt;
      if (input.pointer.down) {
        player.x += (input.pointer.x - player.x) * Math.min(1, dt * 8);
        player.y += (input.pointer.y - 12) * Math.min(1, dt * 8) * 0.2 + (input.pointer.y - player.y) * Math.min(1, dt * 6) * 0.4;
      }
      player.x = clamp(player.x, 40, VW - 40);
      player.y = clamp(player.y, VH * 0.32, VH - 50);

      fireCd -= dt;
      if ((input.down(" ") || input.pointer.down) && fireCd <= 0) {
        fireCd = rapid > 0 ? fireRate * 0.45 : fireRate;
        bullets.push({ x: player.x - 14, y: player.y - 26, vx: 0, vy: -900 });
        bullets.push({ x: player.x + 14, y: player.y - 26, vx: 0, vy: -900 });
        blip.play(720, 0.035, "square", 0.03);
      }
      if (rapid > 0) rapid -= dt;
      if (shake > 0) shake -= dt;

      spawnCd -= dt;
      if (spawnCd <= 0) {
        spawnCd = Math.max(1.4, 3.6 - wave * 0.22);
        spawnWave();
        if (asteroidMode || foes.length === 0) wave += 1;
        api.setStatus(`Wave ${wave} · ${lives} hull integrity`);
      }

      for (const s of stars) {
        s.y += (60 + s.z * 240) * dt;
        if (s.y > VH) {
          s.y = -4;
          s.x = Math.random() * VW;
        }
      }
      for (const b of bullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      bullets = bullets.filter((b) => b.y > -30);

      const hitTargets = (bx: number, by: number) => {
        for (const f of foes) {
          if (Math.abs(bx - f.x) < f.w / 2 && Math.abs(by - f.y) < f.h / 2) {
            f.hp -= 1;
            if (f.hp <= 0) {
              score += f.kind === "boss" ? 1200 : f.kind === "ace" ? 220 : 100;
              api.setScore(score);
              shake = 0.18;
              blip.play(f.kind === "boss" ? 120 : 240, 0.12, "sawtooth", 0.05);
            } else blip.play(520, 0.03, "square", 0.025);
            return true;
          }
        }
        for (const r of rocks) {
          if (Math.hypot(bx - r.x, by - r.y) < r.r) {
            r.hp -= 1;
            if (r.hp <= 0) {
              score += Math.round(180 - r.r);
              api.setScore(score);
              shake = 0.14;
              blip.play(160, 0.14, "sawtooth", 0.05);
              if (r.r > 34) {
                for (let i = 0; i < 2; i++)
                  rocks.push({ x: r.x, y: r.y, vx: rand(-120, 120), vy: rand(60, 200), r: r.r * 0.58, hp: 2 });
              }
            } else blip.play(300, 0.03, "square", 0.025);
            return true;
          }
        }
        return false;
      };

      for (const b of bullets) if (hitTargets(b.x, b.y)) b.y = -999;
      bullets = bullets.filter((b) => b.y > -30);
      foes = foes.filter((f) => f.hp > 0 && f.y < VH + 120);
      rocks = rocks.filter((r) => r.hp > 0 && r.y < VH + 140);

      for (const f of foes) {
        f.t += dt;
        f.y += f.vy * dt;
        f.x += (f.kind === "ace" ? Math.sin(f.t * 1.7) * 190 : f.vx) * dt;
        if (f.kind === "boss") f.x += Math.sin(f.t * 0.8) * 60 * dt;
        if (Math.random() < dt * (f.kind === "boss" ? 2.2 : 0.5)) {
          const ang = Math.atan2(player.y - f.y, player.x - f.x);
          eBullets.push({ x: f.x, y: f.y, vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340 });
        }
        if (Math.abs(f.x - player.x) < (f.w + player.w) / 2 - 12 && Math.abs(f.y - player.y) < (f.h + player.h) / 2 - 12) {
          f.hp = 0;
          damage();
        }
      }
      for (const r of rocks) {
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (r.x < r.r || r.x > VW - r.r) r.vx *= -1;
        if (Math.hypot(r.x - player.x, r.y - player.y) < r.r + 18) {
          r.hp = 0;
          damage();
        }
      }
      for (const b of eBullets) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (Math.abs(b.x - player.x) < 22 && Math.abs(b.y - player.y) < 22) {
          b.y = 9999;
          damage();
        }
      }
      eBullets = eBullets.filter((b) => b.y < VH + 40 && b.y > -40 && b.x > -40 && b.x < VW + 40);

      function damage() {
        lives -= 1;
        shake = 0.32;
        blip.sweep(420, 90, 0.3);
        api.setStatus(`Hull integrity ${Math.max(0, lives)}/3`);
        if (lives <= 0 && !over) {
          over = true;
          api.onOver({ score, stats: { wave, lives: 0 } });
          api.setStatus("Ship destroyed");
        }
      }

      // render
      stage.clear("#06060e");
      for (const s of stars) {
        ctx.fillStyle = `rgba(${s.z > 0.7 ? "167,139,250" : "120,130,180"},${0.16 + s.z * 0.6})`;
        ctx.fillRect(s.x, s.y, 2 + s.z * 2, 2 + s.z * 6);
      }
      ctx.save();
      if (shake > 0) ctx.translate(rand(-6, 6), rand(-6, 6));

      for (const r of rocks) {
        ctx.save();
        ctx.shadowColor = "#FFB020";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#4a3a2a";
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rr = r.r * (0.82 + ((i * 37) % 10) / 34);
          ctx[i === 0 ? "moveTo" : "lineTo"](r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      for (const f of foes) {
        ctx.save();
        const hue = f.kind === "boss" ? "#F43F5E" : f.kind === "ace" ? "#22D3EE" : "#7C3AED";
        ctx.shadowColor = hue;
        ctx.shadowBlur = 22;
        ctx.fillStyle = hue;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y + f.h / 2);
        ctx.lineTo(f.x - f.w / 2, f.y - f.h / 2);
        ctx.lineTo(f.x + f.w / 2, f.y - f.h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      for (const b of bullets) {
        ctx.save();
        ctx.shadowColor = "#22D3EE";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#BEF2FF";
        ctx.fillRect(b.x - 3, b.y - 14, 6, 22);
        ctx.restore();
      }
      for (const b of eBullets) {
        ctx.save();
        ctx.shadowColor = "#F43F5E";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#FF9AA8";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = "#22D3EE";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#67E8F9";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 30);
      ctx.lineTo(player.x - 28, player.y + 24);
      ctx.lineTo(player.x, player.y + 10);
      ctx.lineTo(player.x + 28, player.y + 24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();

      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#9A9AB8";
      ctx.fillText(`HULL ${"◆".repeat(Math.max(0, lives))}${"◇".repeat(Math.max(0, 3 - lives))}`, 24, 40);
      ctx.textAlign = "right";
      ctx.fillText(`WAVE ${wave}`, VW - 24, 40);
      if (over) drawOver(ctx, VW, VH, "SHIP DESTROYED", score);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* RACER — Turbo Drift / Neon Highway                                  */
/* ------------------------------------------------------------------ */
export const racer: EngineFactory = (canvas, api, config) => {
  const lanes = Number(config.lanes ?? 4);
  const rain = config.rain === true;
  const laneW = 190;
  const roadW = lanes * laneW;
  const roadX = VW / 2 - roadW / 2;

  let car = { lane: Math.floor(lanes / 2), x: VW / 2, y: VH - 160, w: 82, h: 150 };
  let traffic: { lane: number; y: number; speed: number; hue: string; hit?: boolean; passed?: boolean }[] = [];
  let speed = 620;
  let distance = 0;
  let score = 0;
  let boost = 0;
  let boosting = 0;
  let over = false;
  let skid = 0;

  const reset = () => {
    car = { lane: Math.floor(lanes / 2), x: VW / 2, y: VH - 160, w: 82, h: 150 };
    traffic = [];
    speed = 620;
    distance = 0;
    score = 0;
    boost = 0;
    boosting = 0;
    over = false;
    skid = 0;
    api.setScore(0);
    api.setStatus("Left/Right to change lane · Up to boost");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();

      if (input.hit("arrowleft", "a")) {
        car.lane = Math.max(0, car.lane - 1);
        skid = -1;
        blip.play(220, 0.05, "triangle", 0.03);
      }
      if (input.hit("arrowright", "d")) {
        car.lane = Math.min(lanes - 1, car.lane + 1);
        skid = 1;
        blip.play(260, 0.05, "triangle", 0.03);
      }
      if (input.pointer.justDown) {
        if (input.pointer.x < VW / 2) car.lane = Math.max(0, car.lane - 1);
        else car.lane = Math.min(lanes - 1, car.lane + 1);
      }
      const targetX = roadX + car.lane * laneW + laneW / 2;
      car.x += (targetX - car.x) * Math.min(1, dt * 11);
      skid *= 0.9;

      const wantBoost = input.down("arrowup", "w") || (input.pointer.down && input.pointer.y < VH * 0.6);
      const braking = input.down("arrowdown", "s");
      if (wantBoost && boost > 0) {
        boosting = Math.min(1, boosting + dt * 3);
        boost = Math.max(0, boost - dt * 28);
      } else boosting = Math.max(0, boosting - dt * 2);

      speed += (braking ? -260 : 34) * dt;
      speed = clamp(speed * (1 + boosting * 0.9 * dt * 2.2), 380, 1500);
      distance += speed * dt;
      score += Math.round(speed * dt * 0.12 * (1 + boosting));
      api.setScore(score);

      if (Math.random() < dt * (1.15 + speed / 1400)) {
        const lane = Math.floor(Math.random() * lanes);
        if (!traffic.some((t) => t.lane === lane && t.y > -320))
          traffic.push({ lane, y: -220, speed: speed * rand(0.42, 0.72), hue: ["#7C3AED", "#22D3EE", "#F43F5E", "#FFB020"][Math.floor(Math.random() * 4)] });
      }

      for (const t of traffic) {
        t.y += (speed - t.speed) * dt;
        const tx = roadX + t.lane * laneW + laneW / 2;
        if (!t.hit && Math.abs(tx - car.x) < 78 && Math.abs(t.y - car.y) < 132) {
          t.hit = true;
          over = true;
          blip.sweep(520, 60, 0.6);
          api.onOver({ score, stats: { distance: Math.round(distance / 10), speed: Math.round(speed) } });
          api.setStatus("Wrecked");
        }
        if (!t.passed && t.y > car.y + 150) {
          t.passed = true;
          const lateral = Math.abs(tx - car.x);
          if (lateral < laneW * 0.92) {
            boost = Math.min(100, boost + 16);
            score += 60;
            api.setScore(score);
            blip.play(880, 0.05, "triangle", 0.035);
            api.setStatus("Near miss! +60 · boost charged");
          }
        }
      }
      traffic = traffic.filter((t) => t.y < VH + 260);

      // render
      stage.clear(rain ? "#080812" : "#07070f");
      const sky = ctx.createLinearGradient(0, 0, 0, VH * 0.4);
      sky.addColorStop(0, rain ? "#12122a" : "#150f2c");
      sky.addColorStop(1, "#07070f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VW, VH * 0.42);
      // city silhouette
      ctx.fillStyle = "#0d0d1c";
      for (let i = 0; i < 26; i++) {
        const bx = i * 42;
        const bh = 60 + ((i * 97) % 150);
        ctx.fillRect(bx, VH * 0.42 - bh, 32, bh);
      }
      // road
      const road = ctx.createLinearGradient(roadX, 0, roadX + roadW, 0);
      road.addColorStop(0, "#0b0b16");
      road.addColorStop(0.5, "#15152a");
      road.addColorStop(1, "#0b0b16");
      ctx.fillStyle = road;
      ctx.fillRect(roadX, 0, roadW, VH);
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#7C3AED";
      ctx.shadowBlur = 24;
      ctx.strokeRect(roadX, 0, roadW, VH);
      ctx.shadowBlur = 0;

      const offset = (distance * 0.6) % 120;
      for (let l = 1; l < lanes; l++) {
        for (let y = -120 + offset; y < VH; y += 120) {
          ctx.fillStyle = "rgba(167,139,250,0.5)";
          ctx.fillRect(roadX + l * laneW - 3, y, 6, 62);
        }
      }
      for (const t of traffic) {
        const tx = roadX + t.lane * laneW + laneW / 2;
        ctx.save();
        ctx.shadowColor = t.hue;
        ctx.shadowBlur = 26;
        ctx.fillStyle = t.hue;
        ctx.fillRect(tx - 38, t.y - 70, 76, 140);
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(tx - 28, t.y - 52, 56, 34);
        ctx.fillStyle = "#FFB020";
        ctx.fillRect(tx - 32, t.y + 52, 16, 10);
        ctx.fillRect(tx + 16, t.y + 52, 16, 10);
      }

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(skid * 0.12);
      ctx.shadowColor = "#22D3EE";
      ctx.shadowBlur = boosting > 0 ? 54 : 30;
      const cg = ctx.createLinearGradient(0, -80, 0, 80);
      cg.addColorStop(0, "#A78BFA");
      cg.addColorStop(1, "#4C1D95");
      ctx.fillStyle = cg;
      ctx.fillRect(-42, -76, 84, 152);
      ctx.restore();
      ctx.fillStyle = "rgba(196,181,253,0.85)";
      ctx.fillRect(car.x - 30, car.y - 56, 60, 40);
      ctx.fillStyle = "#FFB020";
      ctx.fillRect(car.x - 34, car.y + 56, 18, 12);
      ctx.fillRect(car.x + 16, car.y + 56, 18, 12);
      if (boosting > 0) {
        ctx.save();
        ctx.shadowColor = "#22D3EE";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#67E8F9";
        ctx.beginPath();
        ctx.moveTo(car.x - 22, car.y + 76);
        ctx.lineTo(car.x, car.y + 76 + 60 * boosting + Math.random() * 30);
        ctx.lineTo(car.x + 22, car.y + 76);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (rain) {
        ctx.strokeStyle = "rgba(160,190,255,0.22)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 90; i++) {
          const x = (i * 137 + distance * 0.5) % VW;
          const y = (i * 211 + distance * 1.6) % VH;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 8, y + 26);
          ctx.stroke();
        }
      }

      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(`${Math.round(speed / 3.6)} KM/H`, 24, 40);
      ctx.fillStyle = "#6f6f8c";
      ctx.fillText("BOOST", 24, 68);
      ctx.fillStyle = "#24243a";
      ctx.fillRect(96, 56, 180, 12);
      ctx.fillStyle = boost > 25 ? "#22D3EE" : "#7C3AED";
      ctx.fillRect(96, 56, (boost / 100) * 180, 12);
      if (over) drawOver(ctx, VW, VH, "WRECKED", score);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* RUNNER — Cyber Runner / Shadow Sprint                               */
/* ------------------------------------------------------------------ */
export const runner: EngineFactory = (canvas, api, config) => {
  const doubleJump = config.doubleJump === true;
  const gravity = 2600 * Number(config.gravity ?? 1);
  const groundY = VH - 132;

  let py = groundY;
  let vy = 0;
  let jumps = 0;
  let sliding = 0;
  let speed = 520;
  let distance = 0;
  let score = 0;
  let over = false;
  let started = false;
  let obstacles: { x: number; type: "box" | "bar" | "drone" | "gap"; w: number; h: number }[] = [];
  let skyline: { x: number; w: number; h: number }[] = [];
  let spawnIn = 0;

  const reset = () => {
    py = groundY;
    vy = 0;
    jumps = 0;
    sliding = 0;
    speed = 520;
    distance = 0;
    score = 0;
    over = false;
    started = false;
    obstacles = [];
    spawnIn = 1.4;
    skyline = Array.from({ length: 30 }, (_, i) => ({ x: i * 130, w: 60 + ((i * 53) % 90), h: 90 + ((i * 91) % 230) }));
    api.setScore(0);
    api.setStatus("Space to jump · Down to slide");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();
      const wantsJump = input.hit(" ", "arrowup", "w") || input.pointer.justDown;
      const wantsSlide = input.down("arrowdown", "s");

      if (wantsJump && !started) {
        started = true;
        api.setStatus("Run!");
      }
      if (wantsJump) {
        const maxJumps = doubleJump ? 2 : 1;
        if (jumps < maxJumps && !(wantsSlide && py >= groundY)) {
          vy = -1080;
          jumps++;
          blip.play(420 + jumps * 90, 0.07, "square", 0.035);
        }
      }
      if (wantsSlide && py >= groundY) sliding = 0.62;
      if (sliding > 0) sliding -= dt;

      if (started && !over) {
        speed += 12 * dt;
        distance += speed * dt;
        score = Math.round(distance / 12);
        api.setScore(score);
        vy += gravity * dt;
        py += vy * dt;
        if (py >= groundY) {
          py = groundY;
          vy = 0;
          jumps = 0;
        }
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawnIn = rand(0.95, 1.85) * Math.max(0.62, 720 / speed);
          const type = (["box", "bar", "drone", "gap"] as const)[Math.floor(Math.random() * 4)];
          obstacles.push({
            x: VW + 60,
            type,
            w: type === "gap" ? 170 : type === "bar" ? 90 : 72,
            h: type === "box" ? 92 : type === "drone" ? 60 : 120,
          });
        }
        for (const o of obstacles) o.x -= speed * dt;
        obstacles = obstacles.filter((o) => o.x > -260);

        for (const o of obstacles) {
          const px = 190;
          const pTop = py - (sliding > 0 ? 46 : 104);
          const pBottom = py;
          const oTop = o.type === "drone" ? groundY - 150 : o.type === "bar" ? groundY - 128 : groundY - o.h;
          const oBottom = o.type === "drone" ? groundY - 90 : o.type === "bar" ? groundY - 96 : groundY;
          const overlapX = px + 32 > o.x && px - 32 < o.x + o.w;
          const inGap = o.type === "gap" && px > o.x + 12 && px < o.x + o.w - 12 && py >= groundY - 4;
          const overlapY = pBottom > oTop + 6 && pTop < oBottom - 6;
          if (inGap || (o.type !== "gap" && overlapX && overlapY)) {
            over = true;
            blip.sweep(420, 70, 0.55);
            api.onOver({ score, stats: { distance: Math.round(distance / 10) } });
            api.setStatus("Downed");
          }
        }
      }

      // render
      stage.clear("#07070f");
      const sky = ctx.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, "#1a1140");
      sky.addColorStop(0.55, "#0d0b22");
      sky.addColorStop(1, "#07070f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VW, VH);
      ctx.save();
      ctx.translate(-((distance * 0.12) % 130), 0);
      for (const b of skyline) {
        ctx.fillStyle = "#12122b";
        ctx.fillRect(b.x, VH - 200 - b.h, b.w, b.h + 68);
        ctx.fillStyle = "rgba(124,58,237,0.35)";
        for (let wy = 0; wy < b.h - 20; wy += 34)
          for (let wx = 8; wx < b.w - 12; wx += 26) if ((wx * wy) % 5 < 2) ctx.fillRect(b.x + wx, VH - 190 - b.h + wy, 12, 16);
      }
      ctx.restore();
      ctx.fillStyle = "#0a0a16";
      ctx.fillRect(0, groundY, VW, VH - groundY);
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#7C3AED";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(VW, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const stripe = (distance * 1.2) % 90;
      ctx.fillStyle = "rgba(124,58,237,0.22)";
      for (let x = -stripe; x < VW; x += 90) ctx.fillRect(x, groundY + 26, 44, 6);

      for (const o of obstacles) {
        if (o.type === "gap") {
          ctx.fillStyle = "#05050c";
          ctx.fillRect(o.x, groundY, o.w, VH - groundY);
          ctx.strokeStyle = "#F43F5E";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(o.x, groundY);
          ctx.lineTo(o.x, VH);
          ctx.moveTo(o.x + o.w, groundY);
          ctx.lineTo(o.x + o.w, VH);
          ctx.stroke();
          continue;
        }
        const hue = o.type === "drone" ? "#22D3EE" : o.type === "bar" ? "#FFB020" : "#7C3AED";
        ctx.save();
        ctx.shadowColor = hue;
        ctx.shadowBlur = 22;
        ctx.fillStyle = hue;
        const oy = o.type === "drone" ? groundY - 150 : o.type === "bar" ? groundY - 128 : groundY - o.h;
        ctx.fillRect(o.x, oy, o.w, o.type === "drone" ? 60 : o.type === "bar" ? 32 : o.h);
        ctx.restore();
      }

      ctx.save();
      const px = 190;
      const h = sliding > 0 ? 46 : 104;
      ctx.shadowColor = "#A78BFA";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#A78BFA";
      ctx.fillRect(px - 26, py - h, 52, h);
      ctx.restore();
      ctx.fillStyle = "#22D3EE";
      ctx.fillRect(px - 26, py - h + 12, 52, 12);

      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(`${Math.round(distance / 10)} M`, 24, 40);
      if (doubleJump) {
        ctx.fillStyle = "#6f6f8c";
        ctx.fillText("DOUBLE JUMP ENABLED", 24, 68);
      }
      if (over) drawOver(ctx, VW, VH, "DOWNED", score);
      else if (!started) {
        glowText(ctx, "GET READY", VW / 2, VH / 2 - 20, "#22D3EE", 52);
      }
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

/* ------------------------------------------------------------------ */
/* SIM — Sky Chopper                                                   */
/* ------------------------------------------------------------------ */
export const sim: EngineFactory = (canvas, api, config) => {
  const wind = config.wind === true;
  let y = VH / 2;
  let vy = 0;
  let x = 220;
  let towers: { x: number; gapY: number; gapH: number; passed: boolean }[] = [];
  let score = 0;
  let speed = 300;
  let over = false;
  let started = false;
  let t = 0;

  const reset = () => {
    y = VH / 2;
    vy = 0;
    x = 220;
    towers = [];
    score = 0;
    speed = 300;
    over = false;
    started = false;
    t = 0;
    for (let i = 0; i < 5; i++)
      towers.push({ x: VW + i * 380, gapY: rand(180, VH - 180), gapH: 230, passed: false });
    api.setScore(0);
    api.setStatus("Hold Space / mouse to climb");
  };
  reset();

  return beginGame(canvas, api, ({ stage, input, tick }) => {
    const { ctx } = stage;

    tick((dt) => {
      if (over && (input.hit("r", " ") || input.pointer.justDown)) return reset();
      const thrust = input.down(" ", "arrowup", "w") || input.pointer.down;
      if (thrust) started = true;
      if (started) {
        t += dt;
        vy += (thrust ? -1500 : 980) * dt;
        vy *= 0.985;
        if (wind) vy += Math.sin(t * 1.1) * 240 * dt;
        y += vy * dt;
        speed += 4 * dt;
        for (const tw of towers) tw.x -= speed * dt;
        if (towers[0] && towers[0].x < -140) {
          towers.shift();
          towers.push({ x: towers[towers.length - 1].x + 380, gapY: rand(180, VH - 180), gapH: Math.max(160, 230 - score * 2), passed: false });
        }
        for (const tw of towers) {
          if (!tw.passed && tw.x + 120 < x) {
            tw.passed = true;
            score += 1;
            api.setScore(score * 100);
            api.setStatus(`${score} gates cleared`);
            blip.play(660 + Math.min(400, score * 18), 0.07);
          }
          const inX = x + 34 > tw.x && x - 34 < tw.x + 120;
          const inGap = y - 20 > tw.gapY && y + 20 < tw.gapY + tw.gapH;
          if (inX && !inGap && !over) {
            over = true;
            blip.sweep(360, 60, 0.6);
            api.onOver({ score: score * 100, stats: { gates: score } });
            api.setStatus("Rotor strike");
          }
        }
        if (y < 20 || y > VH - 20) {
          over = true;
          blip.sweep(360, 60, 0.6);
          api.onOver({ score: score * 100, stats: { gates: score } });
          api.setStatus("Terrain collision");
        }
      }

      stage.clear("#07070f");
      const sky = ctx.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, "#141033");
      sky.addColorStop(1, "#07070f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VW, VH);
      for (const tw of towers) {
        const grad = ctx.createLinearGradient(tw.x, 0, tw.x + 120, 0);
        grad.addColorStop(0, "#1b1b33");
        grad.addColorStop(1, "#2a2350");
        ctx.fillStyle = grad;
        ctx.fillRect(tw.x, 0, 120, tw.gapY);
        ctx.fillRect(tw.x, tw.gapY + tw.gapH, 120, VH - tw.gapY - tw.gapH);
        ctx.fillStyle = "#7C3AED";
        ctx.fillRect(tw.x, tw.gapY - 12, 120, 12);
        ctx.fillRect(tw.x, tw.gapY + tw.gapH, 120, 12);
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowColor = "#22D3EE";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "#67E8F9";
      ctx.fillRect(-34, -18, 68, 36);
      ctx.restore();
      ctx.strokeStyle = "rgba(103,232,249,0.85)";
      ctx.lineWidth = 5;
      const rot = t * 30;
      ctx.beginPath();
      ctx.moveTo(x - 60 + Math.sin(rot) * 30, y - 30);
      ctx.lineTo(x + 60 + Math.sin(rot) * 30, y - 30);
      ctx.stroke();
      ctx.fillStyle = "#FFB020";
      ctx.fillRect(x + 34, y - 6, 34, 8);

      ctx.font = '600 15px "Chakra Petch", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#FFB020";
      ctx.fillText(`${score} GATES`, 24, 40);
      if (over) drawOver(ctx, VW, VH, "ROTOR STRIKE", score * 100);
    });

    return { destroy() {}, pause() {}, resume() {}, restart: reset };
  });
};

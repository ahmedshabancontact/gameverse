export type GameConfig = Record<string, unknown>;

export type GameAPI = {
  setScore(score: number): void;
  setStatus(text: string): void;
  onOver(result: { score: number; stats: Record<string, number> }): void;
  sound: boolean;
  paused: boolean;
};

export type GameHandle = {
  destroy(): void;
  pause(): void;
  resume(): void;
  restart(): void;
};

export type EngineFactory = (canvas: HTMLCanvasElement, api: GameAPI, config: GameConfig) => GameHandle;

/** Logical stage — every engine draws inside a fixed coordinate space. */
export const VW = 960;
export const VH = 600;

export function createStage(canvas: HTMLCanvasElement, W = VW, H = VH) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  const fit = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(320, Math.round(rect.width * dpr));
    canvas.height = Math.max(200, Math.round(rect.height * dpr));
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  const toLogical = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  return {
    ctx,
    W,
    H,
    toLogical,
    begin() {
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    },
    clear(color = "#05060c") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    },
    dispose() {
      ro.disconnect();
    },
  };
}

export function createInput(canvas: HTMLCanvasElement, stage: { toLogical: (x: number, y: number) => { x: number; y: number } }) {
  const keys = new Set<string>();
  const pressed = new Set<string>();
  const pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false, active: false };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  const onPointer = (e: PointerEvent) => {
    const p = stage.toLogical(e.clientX, e.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
  };
  const onDown = (e: PointerEvent) => {
    onPointer(e);
    pointer.down = true;
    pointer.justDown = true;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onUp = () => {
    pointer.down = false;
    pointer.justUp = true;
  };

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  return {
    keys,
    pressed,
    pointer,
    down(...names: string[]) {
      return names.some((n) => keys.has(n));
    },
    hit(...names: string[]) {
      return names.some((n) => pressed.has(n));
    },
    endFrame() {
      pressed.clear();
      pointer.justDown = false;
      pointer.justUp = false;
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    },
  };
}

export type Input = ReturnType<typeof createInput>;

class Blipper {
  private ctx: AudioContext | null = null;
  enabled = true;
  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }
  play(freq: number, duration = 0.07, type: OscillatorType = "square", gain = 0.05) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
  sweep(from: number, to: number, duration = 0.25) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), ctx.currentTime + duration);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
export const blip = new Blipper();

export function loop(step: (dt: number, t: number) => void) {
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    step(dt, elapsed);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    stop() {
      cancelAnimationFrame(raf);
    },
    start() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
  };
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function glowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 28,
  align: CanvasTextAlign = "center",
  glow = 18
) {
  ctx.save();
  ctx.font = `700 ${size}px "Chakra Petch", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.92;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function panelGrid(ctx: CanvasRenderingContext2D, W: number, H: number, step = 40, color = "rgba(124,58,237,0.12)") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Standard game-over overlay used by every engine. */
export function drawOver(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  title: string,
  score: number,
  hint = "Press R or tap to run it back"
) {
  ctx.save();
  ctx.fillStyle = "rgba(6,6,14,0.82)";
  ctx.fillRect(0, 0, W, H);
  glowText(ctx, title, W / 2, H / 2 - 52, "#FFB020", 52);
  ctx.font = '600 14px "Chakra Petch", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillStyle = "#9A9AB8";
  ctx.fillText("FINAL SCORE", W / 2, H / 2 + 6);
  glowText(ctx, score.toLocaleString(), W / 2, H / 2 + 52, "#FFB020", 60);
  ctx.font = '500 15px "Space Grotesk", system-ui, sans-serif';
  ctx.fillStyle = "#A78BFA";
  ctx.fillText(hint, W / 2, H / 2 + 112);
  ctx.restore();
}

export function beginGame(canvas: HTMLCanvasElement, api: GameAPI, build: (kit: {
  stage: ReturnType<typeof createStage>;
  input: Input;
  tick: (fn: (dt: number, t: number) => void) => void;
}) => GameHandle): GameHandle {
  const stage = createStage(canvas);
  const input = createInput(canvas, stage);
  let paused = false;
  let destroyed = false;
  let stepFn: ((dt: number, t: number) => void) | null = null;
  const raf = loop((dt, t) => {
    if (destroyed) return;
    if (paused || api.paused) return;
    stepFn?.(dt, t);
    input.endFrame();
  });

  const handle = build({
    stage,
    input,
    tick: (fn) => {
      stepFn = fn;
    },
  });

  return {
    destroy() {
      destroyed = true;
      raf.stop();
      input.dispose();
      stage.dispose();
      handle.destroy();
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    restart() {
      handle.restart();
    },
  };
}

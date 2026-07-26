/**
 * Draws the printed face of the hero hang tag onto a 2D canvas.
 *
 * Pure canvas work — no three.js — so it can be unit-tested and, more
 * importantly, so the whole texture is built **once during warmup** and never
 * touched again by the frame loop.
 *
 * Every measurement is a fraction of the texture width, so the resolution can
 * change in one place without redesigning the layout.
 *
 * 📖 Docs: obsidian/frontend/hero-scene.md
 */

export interface TagFaceColors {
  paper: string;
  ink: string;
  inkMuted: string;
  accent: string;
}

export interface TagFaceOptions {
  colors: TagFaceColors;
  /** Font family string, taken from the page so the tag matches the type. */
  fontFamily: string;
  /** Pre-decoded hanger mark; skipped when it failed to load. */
  mark: HTMLImageElement | null;
}

/**
 * Texture resolution. Portrait 2:3 — the tag's own proportions. Generous
 * because the printed lines are small: at 512 wide they turned to mush once
 * the tag was rendered at ~300 CSS px.
 */
export const TAG_TEXTURE_WIDTH = 768;
export const TAG_TEXTURE_HEIGHT = 1152;

/** Where the punched hole sits, in normalised tag space (0–1 from the top). */
export const TAG_HOLE_CENTER_Y = 0.112;
export const TAG_HOLE_RADIUS = 0.052;

/**
 * Letter-spaced text. `ctx.letterSpacing` is not universal, so the glyphs are
 * placed by hand — it also gives exact centring, which the property does not.
 */
const drawTracked = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number,
) => {
  const chars = [...text];
  const width =
    chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) +
    tracking * (chars.length - 1);

  let x = centerX - width / 2;
  for (const char of chars) {
    ctx.fillText(char, x, y);
    x += ctx.measureText(char).width + tracking;
  }
};

const roundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

export const drawTagFace = ({
  colors,
  fontFamily,
  mark,
}: TagFaceOptions): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = TAG_TEXTURE_WIDTH;
  canvas.height = TAG_TEXTURE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const w = TAG_TEXTURE_WIDTH;
  const h = TAG_TEXTURE_HEIGHT;

  // Paper.
  roundedRectPath(ctx, 0, 0, w, h, w * 0.105);
  ctx.fillStyle = colors.paper;
  ctx.fill();

  // Punched hole — cleared, so the cord shows through it.
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(
    w / 2,
    h * TAG_HOLE_CENTER_Y,
    h * TAG_HOLE_RADIUS * 0.62,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();

  // Hairline inner border, the way a real swing tag is die-cut.
  roundedRectPath(ctx, w * 0.031, w * 0.031, w - w * 0.062, h - w * 0.062, w * 0.078);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = w * 0.004;
  ctx.globalAlpha = 0.65;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (mark) {
    const markWidth = w * 0.6;
    const markHeight = (mark.naturalHeight / mark.naturalWidth) * markWidth;
    ctx.drawImage(mark, (w - markWidth) / 2, h * 0.25, markWidth, markHeight);
  }

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.ink;

  ctx.font = `500 ${w * 0.098}px ${fontFamily}`;
  drawTracked(ctx, "RENOVA", w / 2, h * 0.615, w * 0.021);

  ctx.font = `500 ${w * 0.058}px ${fontFamily}`;
  drawTracked(ctx, "CLOSET", w / 2, h * 0.667, w * 0.026);

  // Divider.
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.72);
  ctx.lineTo(w * 0.7, h * 0.72);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = w * 0.005;
  ctx.stroke();

  ctx.fillStyle = colors.inkMuted;
  ctx.font = `500 ${w * 0.042}px ${fontFamily}`;
  drawTracked(ctx, "SANTA HELENA · PR", w / 2, h * 0.788, w * 0.009);

  ctx.fillStyle = colors.accent;
  ctx.font = `600 ${w * 0.044}px ${fontFamily}`;
  drawTracked(ctx, "3X SEM JUROS", w / 2, h * 0.852, w * 0.009);

  return canvas;
};

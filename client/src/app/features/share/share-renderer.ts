import { parseIsoDate } from '../../core/dates';
import {
  buildWeekGrid,
  GridDay,
  HabitShareCard,
  intensity,
  OverviewShareCard,
  SHARE_FORMATS,
  ShareCard,
  ShareFormat,
  ShareTheme,
  wrapText,
} from './share-card';

const SERIF = 'Fraunces, Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';
const ICONS = '"Material Symbols Outlined"';
const PAD = 80;
const HEADER_H = 64;
const FOOTER_H = 40;

type Ctx = CanvasRenderingContext2D;

/** Resolved Material 3 colours for one theme, as `rgb(r, g, b)` strings. */
interface Palette {
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainer: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  heat: string[];
}

/**
 * Resolves CSS colours (including `var(--mat-sys-*)`, `light-dark()` and
 * `color-mix()`) for a forced colour scheme, independent of the page theme.
 */
class ColorResolver {
  private readonly probe: HTMLElement;
  private readonly pixel: CanvasRenderingContext2D;

  constructor(doc: Document, theme: ShareTheme) {
    this.probe = doc.createElement('div');
    this.probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color-scheme:${theme}`;
    doc.body.append(this.probe);
    const canvas = doc.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas is not supported in this browser');
    this.pixel = ctx;
  }

  /** Returns the colour as an opaque-or-alpha `rgba()` string the canvas understands. */
  resolve(css: string): string {
    this.probe.style.color = '';
    this.probe.style.color = css;
    const computed = getComputedStyle(this.probe).color;
    this.pixel.clearRect(0, 0, 1, 1);
    this.pixel.fillStyle = computed;
    this.pixel.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = this.pixel.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
  }

  palette(): Palette {
    const t = (name: string) => this.resolve(`var(--mat-sys-${name})`);
    return {
      surface: t('surface'),
      surfaceContainerLowest: t('surface-container-lowest'),
      surfaceContainer: t('surface-container'),
      surfaceContainerHighest: t('surface-container-highest'),
      onSurface: t('on-surface'),
      onSurfaceVariant: t('on-surface-variant'),
      outlineVariant: t('outline-variant'),
      primary: t('primary'),
      onPrimary: t('on-primary'),
      primaryContainer: t('primary-container'),
      onPrimaryContainer: t('on-primary-container'),
      secondaryContainer: t('secondary-container'),
      onSecondaryContainer: t('on-secondary-container'),
      tertiary: t('tertiary'),
      tertiaryContainer: t('tertiary-container'),
      heat: [1, 2, 3, 4].map((l) => this.resolve(`var(--atom-heat-${l})`)),
    };
  }

  dispose(): void {
    this.probe.remove();
  }
}

/** Replaces the alpha of an `rgba()` string. */
function alpha(color: string, a: number): string {
  return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${a})`);
}

function font(ctx: Ctx, weight: number, size: number, family: string): void {
  ctx.font = `${weight} ${size}px ${family}`;
}

function setTracking(ctx: Ctx, px: number): void {
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`;
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'top',
): void {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(value, x, y);
}

function icon(ctx: Ctx, name: string, cx: number, cy: number, size: number, color: string): void {
  font(ctx, 400, size, ICONS);
  setTracking(ctx, 0);
  text(ctx, name, cx, cy, color, 'center', 'middle');
}

function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawLogo(ctx: Ctx, p: Palette, x: number, y: number, size: number): void {
  const s = size / 64;
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.lineWidth = 3.5 * s;
  ctx.strokeStyle = p.primary;
  for (const deg of [0, 60, 120]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 27 * s, 10.5 * s, (deg * Math.PI) / 180, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = p.tertiary;
  ctx.beginPath();
  ctx.arc(0, 0, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx: Ctx, p: Palette, w: number, h: number): void {
  ctx.fillStyle = p.surface;
  ctx.fillRect(0, 0, w, h);
  const top = ctx.createRadialGradient(w * 0.9, 0, 0, w * 0.9, 0, w * 0.95);
  top.addColorStop(0, alpha(p.primaryContainer, 0.95));
  top.addColorStop(1, alpha(p.primaryContainer, 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h);
  const bottom = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.75);
  bottom.addColorStop(0, alpha(p.tertiaryContainer, 0.55));
  bottom.addColorStop(1, alpha(p.tertiaryContainer, 0));
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, w, h);
}

function drawHeader(ctx: Ctx, p: Palette, w: number, date: string): void {
  drawLogo(ctx, p, PAD, PAD, HEADER_H);
  font(ctx, 600, 46, SERIF);
  setTracking(ctx, 0);
  text(ctx, 'Atom', PAD + HEADER_H + 18, PAD + HEADER_H / 2 + 2, p.onSurface, 'left', 'middle');
  const label = parseIsoDate(date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  font(ctx, 500, 30, SANS);
  text(ctx, label, w - PAD, PAD + HEADER_H / 2, p.onSurfaceVariant, 'right', 'middle');
}

function drawFooter(ctx: Ctx, p: Palette, w: number, h: number): void {
  font(ctx, 500, 28, SANS);
  setTracking(ctx, 0);
  text(ctx, 'Tiny habits. Remarkable results.', PAD, h - PAD, p.onSurfaceVariant, 'left', 'bottom');
  font(ctx, 600, 28, SANS);
  text(ctx, 'Made with Atom', w - PAD, h - PAD, p.primary, 'right', 'bottom');
}

/** A vertical layout block: its height and how to draw it at a given y. */
interface Block {
  height: number;
  draw: (y: number) => void;
}

/**
 * Lays out blocks between the header and footer. The heatmap takes the space
 * that is left (up to a maximum cell size); remaining space becomes even gaps.
 */
function layout(h: number, blocks: Block[], heatmap: (maxHeight: number) => Block): void {
  const top = PAD + HEADER_H + 56;
  const bottom = h - PAD - FOOTER_H - 40;
  const minGap = 40;
  const fixed = blocks.reduce((sum, b) => sum + b.height, 0) + minGap * blocks.length;
  const heat = heatmap(bottom - top - fixed);
  const all = [...blocks, heat];
  const used = all.reduce((sum, b) => sum + b.height, 0);
  const gap = Math.max(24, Math.min(96, (bottom - top - used) / (all.length - 1)));
  const extra = bottom - top - used - gap * (all.length - 1);
  let y = top + Math.max(0, extra / 2);
  for (const block of all) {
    block.draw(y);
    y += block.height + gap;
  }
}

/** Box-style week grid that fills the content width. */
function weekGridBlock(
  ctx: Ctx,
  p: Palette,
  w: number,
  title: string,
  maxHeight: number,
  maxWeeks: number,
  build: (weeks: number) => (GridDay | null)[][],
  fillFor: (day: GridDay) => string,
): Block {
  const contentW = w - PAD * 2;
  const labelH = 52;
  const gapRatio = 0.2;
  // Largest cell that fits the height (gaps scale with the cell), capped at 56px.
  const fitCell = Math.max(6, Math.min(56, (maxHeight - labelH) / (7 + 6 * gapRatio)));
  let gap = Math.max(3, fitCell * gapRatio);
  const weeks = Math.max(8, Math.min(maxWeeks, Math.ceil((contentW + gap) / (fitCell + gap))));
  // Stretch to fill the width, unless the data runs out and cells would get too tall.
  let cell = (contentW - gap * (weeks - 1)) / weeks;
  if (cell > fitCell) {
    cell = fitCell;
    gap = Math.max(3, cell * gapRatio);
  }
  const height = labelH + cell * 7 + gap * 6;
  return {
    height,
    draw: (y) => {
      font(ctx, 600, 30, SANS);
      setTracking(ctx, 0);
      text(ctx, title.replace('{weeks}', String(weeks)), PAD, y, p.onSurface);
      const grid = build(weeks);
      const radius = Math.max(4, cell * 0.2);
      ctx.lineWidth = Math.max(2, cell * 0.06);
      grid.forEach((column, c) =>
        column.forEach((day, r) => {
          if (!day) return;
          const x = PAD + c * (cell + gap);
          const cy = y + labelH + r * (cell + gap);
          if (day.level > 0) {
            roundRect(ctx, x, cy, cell, cell, radius, fillFor(day));
          } else {
            ctx.beginPath();
            const inset = ctx.lineWidth / 2;
            ctx.roundRect(x + inset, cy + inset, cell - inset * 2, cell - inset * 2, radius);
            ctx.strokeStyle = day.inactive ? alpha(p.outlineVariant, 0.4) : p.outlineVariant;
            ctx.stroke();
          }
        }),
      );
    },
  };
}

/** Title block: an eyebrow label and a wrapped serif headline. */
function titleBlock(
  ctx: Ctx,
  p: Palette,
  x: number,
  maxWidth: number,
  eyebrow: string,
  title: string,
  size: number,
): Block {
  font(ctx, 600, size, SERIF);
  setTracking(ctx, 0);
  const lines = wrapText((s) => ctx.measureText(s).width, title, maxWidth, 2);
  const lineH = size * 1.12;
  return {
    height: 40 + lines.length * lineH,
    draw: (y) => {
      font(ctx, 600, 26, SANS);
      setTracking(ctx, 3);
      const label = wrapText(
        (t) => ctx.measureText(t).width,
        eyebrow.toUpperCase(),
        maxWidth,
        1,
      )[0];
      text(ctx, label, x, y, p.primary);
      font(ctx, 600, size, SERIF);
      setTracking(ctx, 0);
      lines.forEach((line, i) => text(ctx, line, x, y + 40 + i * lineH, p.onSurface));
    },
  };
}

/** A row of stat tiles. */
function statTiles(
  ctx: Ctx,
  p: Palette,
  w: number,
  stats: { value: string; label: string }[],
  story: boolean,
): Block {
  const gap = 20;
  const perRow = story ? 2 : stats.length;
  const rows = Math.ceil(stats.length / perRow);
  const tileW = (w - PAD * 2 - gap * (perRow - 1)) / perRow;
  const tileH = story ? 168 : 150;
  return {
    height: rows * tileH + (rows - 1) * gap,
    draw: (y) => {
      stats.forEach((s, i) => {
        const x = PAD + (i % perRow) * (tileW + gap);
        const ty = y + Math.floor(i / perRow) * (tileH + gap);
        roundRect(ctx, x, ty, tileW, tileH, 28, p.surfaceContainer);
        font(ctx, 600, story ? 64 : 52, SERIF);
        setTracking(ctx, 0);
        text(ctx, s.value, x + 28, ty + 26, p.primary);
        font(ctx, 500, 26, SANS);
        text(ctx, s.label, x + 28, ty + tileH - 26, p.onSurfaceVariant, 'left', 'bottom');
      });
    },
  };
}

function drawHabitCard(
  ctx: Ctx,
  p: Palette,
  colors: ColorResolver,
  card: HabitShareCard,
  w: number,
  h: number,
  story: boolean,
): void {
  const tint = colors.resolve(
    `color-mix(in srgb, ${card.color} 22%, var(--mat-sys-surface-container-lowest))`,
  );
  // Same mix the app uses for checked habits: >= 4:1 in both themes.
  const ink = colors.resolve(`color-mix(in srgb, ${card.color} 70%, var(--mat-sys-on-surface))`);
  const avatar = story ? 152 : 128;
  const textX = PAD + avatar + 36;
  const heading = titleBlock(
    ctx,
    p,
    textX,
    w - PAD - textX,
    // The square card has no room for the identity pill, so it becomes the eyebrow.
    !story && card.identity
      ? card.identity
      : card.habitKind === 'break'
        ? 'Breaking a habit'
        : 'Building a habit',
    card.name,
    story ? 72 : 62,
  );

  const blocks: Block[] = [
    {
      height: Math.max(avatar, heading.height),
      draw: (y) => {
        roundRect(ctx, PAD, y, avatar, avatar, avatar * 0.28, tint);
        icon(ctx, card.icon, PAD + avatar / 2, y + avatar / 2, avatar * 0.55, ink);
        heading.draw(y + Math.max(0, (avatar - heading.height) / 2));
      },
    },
  ];

  if (story && card.identity) {
    font(ctx, 500, 30, SANS);
    const statement = wrapText(
      (s) => ctx.measureText(s).width,
      card.identity,
      w - PAD * 2 - 120,
      1,
    )[0];
    const pillW = ctx.measureText(statement).width + 112;
    blocks.push({
      height: 64,
      draw: (y) => {
        roundRect(ctx, PAD, y, pillW, 64, 32, p.secondaryContainer);
        icon(ctx, 'how_to_vote', PAD + 44, y + 32, 34, p.onSecondaryContainer);
        font(ctx, 500, 30, SANS);
        setTracking(ctx, 0);
        text(ctx, statement, PAD + 76, y + 32, p.onSecondaryContainer, 'left', 'middle');
      },
    });
  }

  const s = card.stats;
  const streakNoun = card.habitKind === 'break' ? 'days resisted in a row' : 'day streak';
  const heroH = story ? 300 : 236;
  blocks.push({
    height: heroH,
    draw: (y) => {
      roundRect(ctx, PAD, y, w - PAD * 2, heroH, 40, p.primaryContainer);
      const numberSize = story ? 190 : 150;
      font(ctx, 600, numberSize, SERIF);
      setTracking(ctx, -2);
      const value = String(s.currentStreak);
      text(
        ctx,
        value,
        PAD + 56,
        y + heroH / 2 + numberSize * 0.36,
        p.onPrimaryContainer,
        'left',
        'alphabetic',
      );
      const numberW = ctx.measureText(value).width;
      setTracking(ctx, 0);
      const labelX = PAD + 80 + numberW;
      // Square: a compact stats column replaces the flame and the stat tiles.
      const statsW = story ? 0 : 300;
      const statsX = w - PAD - 48 - statsW;
      font(ctx, 600, story ? 44 : 34, SANS);
      const labelMax = (story ? w - PAD - 200 : statsX - 40) - labelX;
      const lines = wrapText((t) => ctx.measureText(t).width, streakNoun, labelMax, 2);
      const lineH = story ? 48 : 40;
      const iconSize = story ? 0 : 48;
      const labelTop = y + heroH / 2 - (iconSize + lines.length * lineH) / 2;
      if (!story) {
        icon(
          ctx,
          'local_fire_department',
          labelX + iconSize / 2 - 4,
          labelTop + iconSize / 2,
          iconSize,
          p.tertiary,
        );
      }
      // icon() switched the font, so restore the label font before drawing text.
      font(ctx, 600, story ? 44 : 34, SANS);
      lines.forEach((line, i) =>
        text(
          ctx,
          line,
          labelX,
          labelTop + iconSize + i * lineH + lineH / 2,
          p.onPrimaryContainer,
          'left',
          'middle',
        ),
      );
      if (story) {
        icon(ctx, 'local_fire_department', w - PAD - 100, y + heroH / 2, 150, p.tertiary);
        return;
      }
      ctx.fillStyle = alpha(p.onPrimaryContainer, 0.18);
      ctx.fillRect(statsX - 28, y + 36, 2, heroH - 72);
      const rows = [
        [s.totalVotes.toLocaleString(), 'votes cast'],
        [`${Math.round(s.completionRate * 100)}%`, 'last 30 days'],
        [`×${s.compound.toFixed(2)}`, '1% better'],
      ];
      const rowH = (heroH - 64) / rows.length;
      rows.forEach(([value, label], i) => {
        const ry = y + 32 + rowH * i + rowH / 2;
        font(ctx, 600, 40, SERIF);
        text(ctx, value, statsX, ry, p.onPrimaryContainer, 'left', 'middle');
        const vw = ctx.measureText(value).width;
        font(ctx, 500, 24, SANS);
        text(
          ctx,
          label,
          statsX + vw + 12,
          ry + 2,
          alpha(p.onPrimaryContainer, 0.85),
          'left',
          'middle',
        );
      });
    },
  });

  if (story)
    blocks.push(
      statTiles(
        ctx,
        p,
        w,
        [
          { value: s.totalVotes.toLocaleString(), label: 'Votes cast' },
          { value: `${Math.round(s.completionRate * 100)}%`, label: 'Last 30 days' },
          { value: String(s.longestStreak), label: 'Best streak' },
          { value: `×${s.compound.toFixed(2)}`, label: '1% better' },
        ],
        story,
      ),
    );

  layout(h, blocks, (maxHeight) =>
    weekGridBlock(
      ctx,
      p,
      w,
      'Last {weeks} weeks',
      maxHeight,
      52,
      (weeks) =>
        buildWeekGrid(
          card.date,
          weeks,
          (d) => (card.doneDates.has(d) ? 4 : 0),
          (d) => d < card.startDate,
        ),
      () => ink,
    ),
  );
}

function drawOverviewCard(
  ctx: Ctx,
  p: Palette,
  colors: ColorResolver,
  card: OverviewShareCard,
  w: number,
  h: number,
  story: boolean,
): void {
  const first = card.userName.split(/\s+/)[0] || 'My';
  const blocks: Block[] = [
    titleBlock(ctx, p, PAD, w - PAD * 2, 'My habit system', `${first}'s progress`, story ? 84 : 68),
  ];

  const heroH = story ? 320 : 260;
  const ringTrack = colors.resolve(
    'color-mix(in srgb, var(--mat-sys-on-primary-container) 14%, var(--mat-sys-primary-container))',
  );
  blocks.push({
    height: heroH,
    draw: (y) => {
      roundRect(ctx, PAD, y, w - PAD * 2, heroH, 40, p.primaryContainer);
      const r = heroH / 2 - 44;
      const cx = PAD + 40 + r + 14;
      const cy = y + heroH / 2;
      const progress = card.scheduled ? card.completed / card.scheduled : 0;
      ctx.lineCap = 'round';
      ctx.lineWidth = story ? 26 : 22;
      ctx.strokeStyle = ringTrack;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      if (progress > 0) {
        ctx.strokeStyle = p.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }
      font(ctx, 600, story ? 64 : 54, SERIF);
      setTracking(ctx, 0);
      text(
        ctx,
        `${card.completed}/${card.scheduled}`,
        cx,
        cy - 6,
        p.onPrimaryContainer,
        'center',
        'alphabetic',
      );
      font(ctx, 500, 26, SANS);
      text(ctx, 'today', cx, cy + 12, p.onPrimaryContainer, 'center', 'top');

      const tx = cx + r + 56;
      const maxW = w - PAD - 40 - tx;
      const headline =
        card.scheduled === 0
          ? 'A rest day'
          : card.completed === card.scheduled
            ? 'Every habit done today'
            : `${card.completed} of ${card.scheduled} habits done today`;
      font(ctx, 600, story ? 50 : 44, SERIF);
      const lines = wrapText((t) => ctx.measureText(t).width, headline, maxW, 2);
      const lineH = story ? 58 : 52;
      const blockH = lines.length * lineH + 52;
      let ty = cy - blockH / 2;
      lines.forEach((line) => {
        text(ctx, line, tx, ty, p.onPrimaryContainer);
        ty += lineH;
      });
      font(ctx, 500, story ? 32 : 28, SANS);
      const subtitle = story
        ? 'Showing up is what counts.'
        : `${card.totalVotes.toLocaleString()} votes · ${card.bestStreak}-day best streak`;
      const sub = wrapText((t) => ctx.measureText(t).width, subtitle, maxW, 1)[0];
      text(ctx, sub, tx, ty + 14, alpha(p.onPrimaryContainer, 0.85));
    },
  });

  if (story)
    blocks.push(
      statTiles(
        ctx,
        p,
        w,
        [
          { value: card.totalVotes.toLocaleString(), label: 'Votes cast' },
          { value: String(card.bestStreak), label: 'Best streak' },
          { value: String(card.habitCount), label: 'Active habits' },
          ...(story ? [{ value: String(card.identities.length), label: 'Identities' }] : []),
        ],
        story,
      ),
    );

  const identities = [...card.identities].sort((a, b) => b.votes - a.votes).slice(0, story ? 4 : 0);
  if (identities.length) {
    const rowH = 92;
    const maxVotes = Math.max(1, ...identities.map((i) => i.votes));
    blocks.push({
      height: 52 + identities.length * rowH,
      draw: (y) => {
        font(ctx, 600, 30, SANS);
        setTracking(ctx, 0);
        text(ctx, 'Identity votes', PAD, y, p.onSurface);
        identities.forEach((identity, i) => {
          const ry = y + 52 + i * rowH;
          font(ctx, 600, 34, SERIF);
          const count = identity.votes.toLocaleString();
          text(ctx, count, w - PAD, ry, p.primary, 'right');
          const countW = ctx.measureText(count).width;
          font(ctx, 500, 30, SANS);
          const label = wrapText(
            (t) => ctx.measureText(t).width,
            identity.statement,
            w - PAD * 2 - countW - 32,
            1,
          )[0];
          text(ctx, label, PAD, ry + 2, p.onSurface);
          roundRect(ctx, PAD, ry + 52, w - PAD * 2, 12, 6, p.surfaceContainerHighest);
          roundRect(
            ctx,
            PAD,
            ry + 52,
            Math.max(12, ((w - PAD * 2) * identity.votes) / maxVotes),
            12,
            6,
            p.primary,
          );
        });
      },
    });
  }

  const counts = new Map(card.activity.map((d) => [d.date, d.count]));
  const max = Math.max(1, ...card.activity.map((d) => d.count));
  const earliest = card.activity[0]?.date ?? card.date;
  layout(h, blocks, (maxHeight) =>
    weekGridBlock(
      ctx,
      p,
      w,
      'Activity · last {weeks} weeks',
      maxHeight,
      Math.max(8, Math.floor(card.activity.length / 7)),
      (weeks) =>
        buildWeekGrid(
          card.date,
          weeks,
          (d) => intensity(counts.get(d) ?? 0, max),
          (d) => d < earliest,
        ),
      (day) => p.heat[day.level - 1],
    ),
  );
}

/** Makes sure the web fonts used on the card are loaded before drawing. */
async function loadFonts(doc: Document, card: ShareCard): Promise<void> {
  if (!doc.fonts) return;
  const glyphs = [
    'local_fire_department',
    'how_to_vote',
    card.kind === 'habit' ? card.icon : '',
  ].join(' ');
  await Promise.allSettled([
    doc.fonts.load(`600 64px Fraunces`),
    doc.fonts.load(`400 30px Inter`),
    doc.fonts.load(`500 30px Inter`),
    doc.fonts.load(`600 30px Inter`),
    doc.fonts.load(`48px ${ICONS}`, glyphs),
  ]);
}

/** Draws the card and returns it as a PNG blob. */
export async function renderShareCard(
  card: ShareCard,
  format: ShareFormat,
  theme: ShareTheme,
  doc: Document = document,
): Promise<Blob> {
  await loadFonts(doc, card);
  const { width, height } = SHARE_FORMATS[format];
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');

  const colors = new ColorResolver(doc, theme);
  try {
    const p = colors.palette();
    const story = format === 'story';
    drawBackground(ctx, p, width, height);
    drawHeader(ctx, p, width, card.date);
    if (card.kind === 'habit') {
      drawHabitCard(ctx, p, colors, card, width, height, story);
    } else {
      drawOverviewCard(ctx, p, colors, card, width, height, story);
    }
    drawFooter(ctx, p, width, height);
  } finally {
    colors.dispose();
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))),
      'image/png',
    ),
  );
}

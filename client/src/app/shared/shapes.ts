/**
 * Material 3 Expressive shape library, generated as SVG paths in a 100×100
 * box. Every shape uses the same number of points so shapes can morph into one
 * another with a CSS `d` transition.
 */

const POINTS = 120;

export type ShapeName =
  'circle' | 'cookie4' | 'cookie9' | 'cookie12' | 'clover' | 'sunny' | 'burst';

/** [lobes, depth, rotation in degrees] for each shape: r(θ) ∝ 1 + depth·cos(lobes·θ). */
const SHAPES: Record<ShapeName, [number, number, number]> = {
  circle: [0, 0, 0],
  cookie4: [4, 0.07, 45],
  cookie9: [9, 0.055, 0],
  cookie12: [12, 0.045, 0],
  clover: [4, 0.2, 45],
  sunny: [8, 0.09, 0],
  burst: [10, 0.12, 0],
};

const cache = new Map<ShapeName, string>();

/** SVG path data for a named shape, filling a 100×100 viewBox. */
export function shapePath(name: ShapeName): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const [lobes, depth, rotation] = SHAPES[name];
  const rot = (rotation * Math.PI) / 180;
  const max = 1 + depth;
  const parts: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = (i / POINTS) * Math.PI * 2;
    const r = (50 * (1 + depth * Math.cos(lobes * (t - rot)))) / max;
    const x = 50 + r * Math.cos(t - Math.PI / 2);
    const y = 50 + r * Math.sin(t - Math.PI / 2);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const d = `${parts.join(' ')} Z`;
  cache.set(name, d);
  return d;
}

/** CSS value for the `d` property, used to animate between shapes. */
export function shapeCss(name: ShapeName): string {
  return `path("${shapePath(name)}")`;
}

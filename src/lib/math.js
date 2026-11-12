export function clamp01(x) { return Math.min(1, Math.max(0, x)); }
export function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
export function outCubic(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
export function outBack(x) { x = clamp01(x); var c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
// Pseudo-aléatoire stable : même entrée, même sortie
export function hash(n) { var s = Math.sin(n * 127.1 + 11.7) * 43758.5453; return s - Math.floor(s); }

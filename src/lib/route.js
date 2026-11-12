import { smooth } from "./math.js";

/* Défilement : chaque section [data-stop] est une étape du trajet.
   0 = accueil, 1 à 5 = projets, 6 = contact, avec les fractions entre deux étapes. */

export const mqMobile = window.matchMedia("(max-width: 860px)");
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let anchors = [0, 1];

export function measure() {
  const stops = Array.from(document.querySelectorAll("[data-stop]"));
  if (stops.length < 2) return;
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  anchors = stops.map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const a = mqMobile.matches ? top : top + el.offsetHeight / 2 - vh / 2;
    return Math.min(max, Math.max(0, a));
  });
  anchors[0] = 0;
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
  }
}

function position() {
  const s = window.scrollY, n = anchors.length;
  if (s <= anchors[0]) return 0;
  for (let i = 0; i < n - 1; i++) {
    if (s < anchors[i + 1]) return i + (s - anchors[i]) / (anchors[i + 1] - anchors[i]);
  }
  return n - 1;
}

// Position adoucie : la caméra reste sur une étape, puis voyage vers la suivante.
export function eased() {
  const t = position(), n = anchors.length;
  const i = Math.min(Math.floor(t), n - 2);
  let f = t - i;
  const a = mqMobile.matches ? 0.25 : 0.2, b = mqMobile.matches ? 0.95 : 0.8;
  f = reduceMotion ? (f < 0.5 ? 0 : 1) : smooth((f - a) / (b - a));
  return { i, f, v: i + f };
}

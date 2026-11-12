import { useEffect, useState } from "react";
import { measure, eased } from "../lib/route.js";

/* Renvoie l'étape affichée : -1 accueil, 0 à 4 projets, 5 contact. */
export function useActiveStop() {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setActive(Math.round(eased().v) - 1);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
  }, []);

  return active;
}

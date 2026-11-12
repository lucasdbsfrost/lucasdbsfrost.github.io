import { useEffect, useRef } from "react";

/* Le canvas 3D. Le code de la scène est chargé à part, après le texte. */
export default function Scene({ onState }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let stop = null, cancelled = false;
    import("../three/network.js")
      .then(({ startNetwork }) => {
        if (cancelled) return;
        stop = startNetwork(canvasRef.current);
        onState(stop ? "ready" : "off");
      })
      .catch(() => { if (!cancelled) onState("off"); });
    return () => {
      cancelled = true;
      if (stop) stop();
    };
  }, [onState]);

  return <canvas id="scene" ref={canvasRef} aria-hidden="true" />;
}

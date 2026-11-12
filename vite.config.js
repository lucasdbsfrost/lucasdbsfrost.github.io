import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Politique de sécurité du contenu (CSP), ajoutée uniquement au site publié.
// Tout vient du site lui-même : aucun script, style, police ou requête externe.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function securityHeaders() {
  return {
    name: "security-meta",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<!-- securite -->",
        `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n    <meta name="referrer" content="strict-origin-when-cross-origin">`
      );
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), securityHeaders()],
  build: {
    sourcemap: false,     // ne publie pas le code source lisible
    assetsInlineLimit: 0, // pas de fichiers intégrés en data:, la CSP reste stricte
    chunkSizeWarningLimit: 700, // three.js est gros, mais chargé à part après le texte
  },
});

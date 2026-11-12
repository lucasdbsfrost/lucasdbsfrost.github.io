import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/red-hat-display";
import "./styles/base.css";
import "./styles/scene.css";
import "./styles/nav.css";
import "./styles/hero.css";
import "./styles/projects.css";
import "./styles/contact.css";
import "./styles/responsive.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

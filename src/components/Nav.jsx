import { config } from "../config.js";

export default function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#accueil">Lucas Dubuis</a>
      <div className="nav-links">
        <a href="#projets">Projets</a>
        <a href="#contact">Contact</a>
        <a className="nav-cv" href={config.cvUrl} target="_blank" rel="noopener noreferrer">Mon CV</a>
      </div>
    </header>
  );
}

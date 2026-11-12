import { config } from "../config.js";

export default function Contact() {
  return (
    <section className="contact" id="contact" data-stop>
      <div className="sheet">
        <h2>Me joindre directement</h2>
        <a className="tel" href={`tel:${config.phoneTel}`}>{config.phoneDisplay}</a>
        <p className="place">Marseille &amp; alentours</p>
        <div className="actions">
          <a className="btn btn-primary" href={config.cvUrl} target="_blank" rel="noopener noreferrer">
            Télécharger mon CV complet
          </a>
          <a className="btn btn-ghost" href={config.githubUrl} target="_blank" rel="noopener noreferrer">
            Voir mon GitHub
          </a>
        </div>
      </div>
      <footer className="foot">
        <span>Curiosité, rigueur, technique</span>
        <span>{new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}

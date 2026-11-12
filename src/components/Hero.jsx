import { config } from "../config.js";

export default function Hero() {
  return (
    <section className="hero" id="accueil" data-stop>
      <h1>
        <span><i>Tester.</i></span>
        <span><i>Apprendre.</i></span>
      </h1>
      <p className="lede">
        Récemment diplômé en <strong>BTS CIEL (ex SNIR)</strong>. Je combine la logique du développement
        applicatif avec une passion rigoureuse pour l’administration systèmes, les architectures réseaux
        et la sécurité informatique.
      </p>
      <p className="status">À la recherche d’un emploi ou d’une alternance</p>
      <div className="actions">
        <a className="btn btn-primary" href={config.cvUrl} target="_blank" rel="noopener noreferrer">
          Télécharger mon CV complet
        </a>
        <a className="btn btn-ghost" href="#projets">Voir les projets</a>
      </div>
    </section>
  );
}

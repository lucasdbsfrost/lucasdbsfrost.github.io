import { projects } from "../data/projects.jsx";

/* Itinéraire entre les projets : liste à droite sur ordinateur, barre de progression sur téléphone. */
export default function ProjectRail({ active }) {
  return (
    <nav className="route" aria-label="Projets">
      <ol>
        {projects.map((p, i) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              className={i < active ? "done" : undefined}
              aria-current={i === active ? "true" : undefined}
            >
              {p.short}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

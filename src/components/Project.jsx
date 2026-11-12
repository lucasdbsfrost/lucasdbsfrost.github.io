export default function Project({ project, groupTitle }) {
  const { id, title, subtitle, summary, details, link } = project;
  return (
    <section className="hop" id={id} data-stop>
      <div className="sheet">
        {groupTitle && <h2 className="group-title">{groupTitle}</h2>}
        <h3>{title}</h3>
        <p className="sub">{subtitle}</p>
        <p>{summary}</p>
        <h4>Détails d’implémentation</h4>
        <ul>
          {details.map((detail, i) => <li key={i}>{detail}</li>)}
        </ul>
        {link && (
          <a className="doc-link" href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        )}
      </div>
    </section>
  );
}

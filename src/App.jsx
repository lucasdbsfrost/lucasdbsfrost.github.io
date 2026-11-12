import { useState } from "react";
import Scene from "./components/Scene.jsx";
import Nav from "./components/Nav.jsx";
import ProjectRail from "./components/ProjectRail.jsx";
import Hero from "./components/Hero.jsx";
import Project from "./components/Project.jsx";
import Contact from "./components/Contact.jsx";
import { projects } from "./data/projects.jsx";
import { useActiveStop } from "./hooks/useActiveStop.js";

export default function App() {
  const active = useActiveStop();                 // -1 accueil, 0 à 4 projets, 5 contact
  const [scene, setScene] = useState("loading");  // "loading", "ready" ou "off" (sans WebGL)

  const classes = ["app"];
  if (scene === "ready") classes.push("ready");
  if (scene === "off") classes.push("no-webgl");
  if (active >= 0 && active < projects.length) classes.push("on-route");

  return (
    <div className={classes.join(" ")}>
      <Scene onState={setScene} />
      <div className="scrim" aria-hidden="true" />
      <a className="skip" href="#projets">Aller aux projets</a>
      <Nav />
      <ProjectRail active={active} />
      <main>
        <Hero />
        <div id="projets">
          {projects.map((project, i) => (
            <Project
              key={project.id}
              project={project}
              groupTitle={i === 0 ? "Laboratoire & expérimentations" : null}
            />
          ))}
        </div>
        <Contact />
      </main>
    </div>
  );
}

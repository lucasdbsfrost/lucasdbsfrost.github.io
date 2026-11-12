# Portfolio de Lucas Dubuis

Site React (Vite) avec une scène 3D en three.js. Le défilement fait voyager la caméra
d une machine à l’autre, une par projet.

## Organisation

```
index.html              Page d’entrée (très courte)
.env.example            Modèle de réglages locaux (le vrai .env reste hors de Git)
public/                 Fichiers publiés tels quels (CV, robots.txt)
private/                Fichiers personnels, jamais envoyés sur GitHub
src/
  main.jsx              Point de départ
  App.jsx               Assemble les sections
  config.js             Téléphone, lien du CV, lien GitHub
  data/projects.jsx     Textes des cinq projets
  components/           Un fichier par bloc (Nav, Hero, Project, Contact...)
  hooks/                Suivi de la section affichée
  lib/                  Calculs de défilement et fonctions mathématiques
  three/                Scène 3D (network.js) et son kit de construction (kit.js)
  styles/               Un fichier CSS par partie du site
.github/                Publication automatique et mises à jour de sécurité
```

## Commandes

```bash
npm ci          # installe exactement les versions du fichier package-lock.json
npm run dev     # site en local, avec rechargement automatique
npm run build   # génère le site dans dist/
npm run preview # sert dist/ pour vérifier avant de publier
npm run audit   # cherche des failles connues dans les dépendances
```

## Mise en ligne

1. Envoie tout le projet sur la branche `main` du dépôt.
2. Sur GitHub : Settings, puis Pages, puis « Source » : choisis **GitHub Actions**.
3. À chaque envoi sur `main`, le site est compilé et publié (onglet Actions pour suivre).

Tant que l’étape 2 n’est pas faite, GitHub sert le `index.html` brut et la page reste vide.

## Sécurité : ce qui est en place

- **Aucune ressource externe** : three.js et la police sont installés avec npm et servis
  par le site. Pas de CDN, pas de requête vers un tiers.
- **Content-Security-Policy stricte**, ajoutée au moment du build : seuls les scripts,
  styles et polices du site peuvent se charger. Pas de script en ligne.
- **Versions exactes** des dépendances, verrouillées par `package-lock.json`, installées
  avec `npm ci`.
- **Publication à droits réduits** : le workflow ne peut que lire le code et publier
  sur Pages ; les actions sont épinglées sur une empreinte exacte.
- **Dependabot** propose chaque semaine les mises à jour des dépendances.
- **Liens externes** ouverts avec `rel="noopener noreferrer"`.
- **Aucun `dangerouslySetInnerHTML`** : React échappe tout le texte affiché.
- **Pas de carte source** publiée.

## Sécurité : les limites à connaître

- **Un site statique n’a pas de secret.** Tout ce que le navigateur reçoit est lisible
  par n’importe qui. Les variables `VITE_...` du fichier `.env` sont intégrées au
  JavaScript publié : elles servent à régler le site, pas à cacher quelque chose.
- **Le dépôt est public** : tout ce qui est envoyé sur GitHub est visible. Seuls `.env`
  et le contenu de `private/` restent sur ta machine, parce que `.gitignore` les exclut.
- **Si tu as un jour besoin d’une vraie clé secrète** (API payante, envoi d’e-mails),
  elle doit vivre sur un serveur ou une fonction serverless, jamais dans ce projet.
- Les en-têtes HTTP de sécurité (HSTS, X-Frame-Options) ne se règlent pas sur
  GitHub Pages. La CSP est donc posée par une balise `<meta>`.

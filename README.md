# Mon portfolio

Salut, moi c'est Lucas. Diplômé d'un BTS CIEL, je m'intéresse surtout à
l'administration systèmes, aux réseaux et à la sécurité informatique.
Je cherche un emploi ou une alternance à Marseille.

Le site est en ligne ici : https://lucasdbsfrost.github.io

## L'idée

Plutôt qu'une simple page avec une liste de projets, j'ai voulu que le site
ressemble à ce que je fais : un petit réseau en 3D. Un commutateur au centre,
une machine par projet, et quand on fait défiler la page, la caméra passe
d'une machine à l'autre. Chaque machine montre à sa façon ce que fait le
projet : le pare-feu bloque des paquets, l'analyseur de logs repère les
lignes suspectes, etc.

Le site fonctionne aussi sur téléphone, et reste lisible si la 3D ne peut
pas s'afficher.

## Comment c'est fait

Le site est en React avec Vite, et la scène 3D est faite avec three.js.
Tous les objets sont construits en code à partir de formes simples, sans
modèle 3D à télécharger, pour que ça reste léger.

Si tu veux fouiller dans le code :

- les textes des projets sont dans `src/data/projects.jsx`
- chaque partie de la page a son composant dans `src/components/`
- la scène 3D est dans `src/three/`
- le style est découpé par section dans `src/styles/`

## Le lancer chez soi

```bash
npm ci
npm run dev
```

Le site est republié automatiquement par GitHub Actions à chaque envoi sur
la branche `main`.

## Côté sécurité

Vu que c'est mon domaine, j'ai essayé de faire les choses proprement, même
pour un site vitrine. Le site ne charge rien depuis l'extérieur : three.js
et la police sont servis par le site lui-même, et une Content-Security-Policy
stricte interdit tout script qui ne vient pas de lui. Les versions des
dépendances sont figées, Dependabot me prévient quand une mise à jour sort,
et la publication tourne avec le minimum de droits.

Ce que j'ai aussi gardé en tête : un site statique ne peut rien cacher.
Tout ce qui arrive dans le navigateur est lisible par n'importe qui, donc il
n'y a aucun secret dans ce projet, et il n'y en aura pas. Le fichier `.env`
et le dossier `private/` servent juste à garder mes fichiers de travail
hors du dépôt public.

## Me contacter

Mon CV est téléchargeable directement sur le site, et mon numéro est en bas
de la page.

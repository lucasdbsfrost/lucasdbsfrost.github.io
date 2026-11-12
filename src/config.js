/* Réglages du site. Chaque valeur peut être remplacée dans un fichier .env
   (voir .env.example). Ces valeurs sont publiques : elles finissent dans le
   JavaScript envoyé aux visiteurs. Aucun secret ici. */
const env = import.meta.env;

export const config = {
  phoneDisplay: env.VITE_PHONE_DISPLAY || "06 83 00 49 03",
  phoneTel: env.VITE_PHONE_TEL || "0683004903",
  cvUrl: env.VITE_CV_URL || "cv/cv_lucas_dubuis_pdf_alternance.pdf",
  githubUrl: env.VITE_GITHUB_URL || "https://github.com/lucasdbsfrost",
};

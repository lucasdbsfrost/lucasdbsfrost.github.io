/* Les cinq projets, dans l'ordre du trajet. Pour modifier un texte, c'est ici. */
export const projects = [
  {
    id: "serveur-linux",
    short: "Serveur Linux",
    title: "Serveur Linux autogéré",
    subtitle: "Recyclage matériel & hosting privé",
    summary:
      "Transformation complète d’une machine physique grand public en serveur Linux dédié à l’hébergement de services (Minecraft).",
    details: [
      <><strong>OS :</strong> installation et durcissement d’une distribution Debian Server (CLI uniquement).</>,
      <><strong>Réseau :</strong> configuration IP statique LAN, routage et translation d’adresses (NAT/PAT) sur passerelle résidentielle.</>,
      <><strong>Optimisation :</strong> paramétrage des arguments de la JVM (Java Virtual Machine) pour la gestion dynamique des allocations de mémoire RAM.</>,
    ],
  },
  {
    id: "pxe",
    short: "Infrastructure PXE",
    title: "Infrastructure PXE",
    subtitle: "Automatisation de déploiement réseau",
    summary:
      "Mise en place d’un environnement réseau permettant l’installation d’architectures OS sans support physique local.",
    details: [
      <>Gestion des chargeurs d’amorçage réseau (Syslinux / GRUB Netboot) pour proposer des installations multisystèmes.</>,
    ],
    link: {
      href: "https://github.com/lucasdbsfrost/Serveur-pxe-dubuisXgadeau",
      label: "Consulter la documentation sur GitHub",
    },
  },
  {
    id: "ipv6",
    short: "Réseau IPv6",
    title: "Maquette réseau IPv6",
    subtitle: "Simulation d’architectures routées",
    summary:
      "Conception complète et routage d’une topologie réseau complexe sous l’environnement Cisco Packet Tracer.",
    details: [
      <>Mise en œuvre du routage statique et dynamique inter-routeurs basé intégralement sur l’adressage IPv6.</>,
      <>Configuration des mécanismes d’auto-configuration d’adresses de type <strong>SLAAC</strong> (Stateless Address Autoconfiguration) et d’annonces de routeurs (RA).</>,
    ],
  },
  {
    id: "securite",
    short: "Sécurité",
    title: "Lab sécurité & hardening",
    subtitle: "Audit et protection d’environnements virtualisés",
    summary:
      "Auditer l’exposition d’un système virtualisé pour appliquer les règles de filtrage réseau adaptées.",
    details: [
      <><strong>Reconnaissance :</strong> utilisation de l’outil Nmap (scans SYN, détection de bannières et de versions de services applicatifs).</>,
      <><strong>Filtrage :</strong> écriture de politiques restrictives sur le pare-feu applicatif hôte via l’utilitaire de configuration UFW (Iptables backend).</>,
    ],
  },
  {
    id: "logs",
    short: "Logs Python",
    title: "Analyseur de logs Python",
    subtitle: "Scripting au service de la supervision",
    summary:
      "Développement de scripts légers d’automatisation dédiés au traitement de fichiers volumineux et à la détection d’anomalies.",
    details: [
      <>Parsing de fichiers systèmes (<code>/var/log/auth.log</code>, serveurs Web) à l’aide d’expressions régulières (Regex) en Python.</>,
      <>Extraction automatisée des adresses IP suspectes effectuant des requêtes malveillantes ou des tentatives d’intrusion répétées (brute-force).</>,
    ],
  },
];

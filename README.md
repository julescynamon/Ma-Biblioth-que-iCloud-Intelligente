# Ma Bibliothèque iCloud Intelligente

Application web locale pour explorer, organiser et lire votre collection de livres numériques stockés sur iCloud Drive.

![Capture d'écran de l'application](screenshot.png)

## Fonctionnalités

- 📁 Scan automatique des fichiers dans iCloud Drive > Bibliothèque et "Livres à lire"
- 🔍 Extraction des métadonnées (titre, auteur, couverture, résumé, genre) pour chaque fichier
- 🧠 Classification automatique des livres par genre
- 🎯 Affichage prioritaire des fichiers du dossier "Livres à lire"
- 📦 Génération d'un fichier `catalogue.json` stocké localement
- 🎨 Interface utilisateur type Netflix avec grille de couvertures et filtres
- 📖 Page de détail pour chaque livre avec métadonnées et options de lecture
- 📲 Ouverture directe dans Apple Livres ou téléchargement des fichiers
- 🛠️ Page d'administration pour relancer le scan et régénérer le catalogue
- 🔐 Application 100% locale - aucune donnée n'est envoyée vers un serveur distant

## Formats de fichiers supportés

- EPUB (.epub)
- PDF (.pdf)
- Comic Book ZIP (.cbz)
- Comic Book RAR (.cbr)

## Prérequis

- macOS (pour accéder à iCloud Drive)
- Node.js 18+ et npm
- Un dossier "Bibliothèque" dans votre iCloud Drive contenant vos livres numériques
- Optionnel : un dossier "Livres à lire" dans votre iCloud Drive pour les livres prioritaires

## Installation

1. Clonez ce dépôt sur votre Mac :

```bash
git clone https://github.com/votre-nom/ma-bibliotheque-icloud-intelligente.git
cd ma-bibliotheque-icloud-intelligente/ma-bibliotheque-icloud
```

2. Installez les dépendances :

```bash
npm install
```

3. Installez les dépendances du script de scan :

```bash
npm install -g uuid axios sharp glob fs-extra
```

4. Configurez les chemins de vos dossiers dans le script de scan :

Ouvrez le fichier `scripts/scan.js` et modifiez les chemins dans la section CONFIG :

```javascript
const CONFIG = {
  libraryPath: process.env.LIBRARY_PATH || '/Users/votre-nom/Library/Mobile Documents/com~apple~CloudDocs/Bibliothèque',
  toReadPath: process.env.TO_READ_PATH || '/Users/votre-nom/Library/Mobile Documents/com~apple~CloudDocs/Livres à lire',
  // ...
};
```

## Utilisation

### Génération du catalogue

Pour scanner vos fichiers et générer le catalogue :

```bash
node scripts/scan.js
```

Cela créera un fichier `catalogue.json` dans le dossier `public/data/` et téléchargera les couvertures dans `public/data/covers/`.

### Lancement de l'application

Pour démarrer l'application en mode développement :

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

### Construction pour la production

Pour construire l'application pour la production :

```bash
npm run build
```

Puis pour la démarrer :

```bash
npm run start
```

### Déploiement sur Vercel

Vous pouvez déployer l'application sur Vercel pour y accéder depuis tous vos appareils :

```bash
npm install -g vercel
vercel
```

## Structure du projet

```
ma-bibliotheque-icloud/
├── public/               # Fichiers statiques
│   ├── data/             # Données générées (catalogue.json, couvertures)
│   └── images/           # Images de l'application
├── scripts/              # Scripts utilitaires
│   └── scan.js           # Script de scan et génération du catalogue
├── src/
│   ├── app/              # Pages de l'application (Next.js App Router)
│   ├── components/       # Composants React
│   ├── lib/              # Fonctions utilitaires
│   └── types/            # Types TypeScript
└── README.md             # Documentation
```

## Personnalisation

### Thème

L'application supporte les thèmes clair et sombre, avec détection automatique des préférences système.

### API de métadonnées

Par défaut, l'application utilise Google Books API et Open Library pour récupérer les métadonnées des livres. Pour utiliser Google Books API avec une clé, ajoutez votre clé API dans le fichier `scripts/scan.js` :

```javascript
const CONFIG = {
  // ...
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || 'VOTRE_CLE_API',
  // ...
};
```

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

Créé avec ❤️ pour les amateurs de lecture numérique

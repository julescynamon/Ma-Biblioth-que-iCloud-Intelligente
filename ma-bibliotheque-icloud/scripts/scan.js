#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { fileURLToPath } from "url";

// Obtenir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  libraryPath:
    process.env.LIBRARY_PATH ||
    "/Users/jules/Library/Mobile Documents/com~apple~CloudDocs/collection livre et BD",
  toReadPath:
    process.env.TO_READ_PATH ||
    "/Users/jules/Library/Mobile Documents/com~apple~CloudDocs/collection livre et BD/livre a lire",
  outputPath:
    process.env.OUTPUT_PATH ||
    path.join(__dirname, "../public/data/catalogue.json"),
  coverOutputDir:
    process.env.COVER_OUTPUT_DIR ||
    path.join(__dirname, "../public/data/covers"),
  supportedExtensions: [".epub", ".pdf", ".cbz", ".cbr"],
  googleBooksApiKey:
    process.env.GOOGLE_BOOKS_API_KEY ||
    "AIzaSyAcGpHSn-5IF3qCtrzuYJjprych9kATbU8",
  openLibraryBaseUrl: "https://openlibrary.org",
  openLibrarySearchUrl: "https://openlibrary.org/search.json",
  openLibraryBooksUrl: "https://openlibrary.org/api/books",
  cacheFilePath: path.join(__dirname, "../data/cache_api.json"),
  apiRequestDelay: 500, // Délai entre les requêtes API en ms
  maxResults: 10, // Nombre maximal de résultats à demander
  retryDelay: 5000, // Délai avant de réessayer en cas d'erreur 429 (en ms)
  maxRetries: 3, // Nombre maximal de tentatives en cas d'erreur
};

// Fonction utilitaire pour ajouter un délai
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Créer les dossiers nécessaires s'ils n'existent pas
fs.ensureDirSync(path.dirname(CONFIG.outputPath));
fs.ensureDirSync(CONFIG.coverOutputDir);
fs.ensureDirSync(path.dirname(CONFIG.cacheFilePath));

// Système de cache pour les requêtes API
let apiCache = {};

// Charger le cache existant s'il existe
function loadApiCache() {
  try {
    if (fs.existsSync(CONFIG.cacheFilePath)) {
      const cacheData = fs.readFileSync(CONFIG.cacheFilePath, "utf8");
      apiCache = JSON.parse(cacheData);
      console.log(
        `Cache API chargé avec ${Object.keys(apiCache).length} entrées`
      );
    } else {
      console.log(
        "Aucun cache API existant trouvé, création d'un nouveau cache"
      );
      apiCache = {
        googleBooks: {},
        openLibrary: {},
        lastUpdated: new Date().toISOString(),
      };
      saveApiCache(); // Créer le fichier de cache initial
    }
  } catch (error) {
    console.error("Erreur lors du chargement du cache API:", error.message);
    // Réinitialiser le cache en cas d'erreur
    apiCache = {
      googleBooks: {},
      openLibrary: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Sauvegarder le cache dans un fichier
function saveApiCache() {
  try {
    apiCache.lastUpdated = new Date().toISOString();
    fs.writeFileSync(
      CONFIG.cacheFilePath,
      JSON.stringify(apiCache, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du cache API:", error.message);
  }
}

// Générer une clé de cache normalisée à partir du titre et de l'auteur (si disponible)
function generateCacheKey(title, author = "") {
  // Normaliser le titre et l'auteur (minuscules, sans accents, sans caractères spéciaux)
  const normalizedTitle = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]/g, ""); // Supprimer les caractères spéciaux

  const normalizedAuthor = author
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  // Combiner titre et auteur si l'auteur est disponible
  return normalizedAuthor
    ? `${normalizedTitle}_${normalizedAuthor}`
    : normalizedTitle;
}

// Fonction principale
async function main() {
  console.log("Démarrage du scan de la bibliothèque...");

  // Charger le cache API
  loadApiCache();

  try {
    // Scan des fichiers
    const files = await scanFiles();
    console.log(`${files.length} fichiers trouvés.`);

    // Extraction des métadonnées
    const books = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `Traitement du fichier ${i + 1}/${files.length}: ${path.basename(
          file.path
        )}`
      );

      try {
        const book = await extractMetadata(file);
        books.push(book);
      } catch (error) {
        console.error(
          `Erreur lors de l'extraction des métadonnées pour ${file.path}:`,
          error.message
        );
      }
    }

    // Génération du catalogue
    const catalogue = {
      lastUpdated: new Date().toISOString(),
      books: books,
    };

    // Écriture du catalogue JSON
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify(catalogue, null, 2));

    // Sauvegarde finale du cache API
    console.log(
      `Sauvegarde du cache API avec ${
        Object.keys(apiCache.googleBooks).length
      } entrées Google Books et ${
        Object.keys(apiCache.openLibrary).length
      } entrées Open Library`
    );
    saveApiCache();

    console.log(`Catalogue généré avec succès: ${CONFIG.outputPath}`);
    console.log(`Nombre de livres: ${catalogue.books.length}`);
  } catch (error) {
    console.error("Erreur lors de la génération du catalogue:", error);
    // Tenter de sauvegarder le cache même en cas d'erreur
    saveApiCache();
    process.exit(1);
  }
}

// Scan des fichiers dans les dossiers configurés
async function scanFiles() {
  const files = [];

  // Fonction pour scanner un dossier
  const scanDir = (dirPath, isToRead = false) => {
    const pattern = `${dirPath}/**/*@(.epub|.pdf|.cbz|.cbr)`;
    const options = {
      nocase: true,
      ignore: ["**/node_modules/**", "**/.*/**"],
    };

    const matches = glob.sync
      ? glob.sync(pattern, options)
      : glob(pattern, options);

    return matches.map((filePath) => {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase(),
        size: stats.size,
        mtime: stats.mtime,
        toRead: isToRead,
      };
    });
  };

  // Scan du dossier principal
  if (fs.existsSync(CONFIG.libraryPath)) {
    files.push(...scanDir(CONFIG.libraryPath));
  } else {
    console.warn(
      `Le dossier de bibliothèque n'existe pas: ${CONFIG.libraryPath}`
    );
  }

  // Scan du dossier "À lire"
  if (fs.existsSync(CONFIG.toReadPath)) {
    files.push(...scanDir(CONFIG.toReadPath, true));
  } else {
    console.warn(`Le dossier "À lire" n'existe pas: ${CONFIG.toReadPath}`);
  }

  return files;
}

// Extraction des métadonnées d'un fichier
async function extractMetadata(file) {
  // Métadonnées de base
  const book = {
    id: uuidv4(),
    title: getNameWithoutExtension(file.name),
    author: "Auteur inconnu",
    cover: "",
    summary: "",
    language: "",
    publisher: "",
    publishedDate: "",
    filePath: file.path,
    fileType: getFileExtension(file.name),
    fileSize: file.size,
    toRead: false,
    addedDate: new Date().toISOString(),
    genre: "Non classé", // Valeur par défaut pour le genre
  };

  // Extraction du genre à partir du chemin du fichier
  const genreFromPath = extractGenreFromPath(file.path);
  if (genreFromPath) {
    book.genre = genreFromPath;
  }

  // Extraction de l'auteur à partir du nom de fichier
  const authorFromFilename = extractAuthorFromFilename(file.name);
  if (authorFromFilename) {
    book.author = authorFromFilename;
  }

  // Extraction des informations de série depuis le nom de fichier
  const serieInfoFromFilename = extractSerieInfoFromFilename(file.name);
  if (serieInfoFromFilename) {
    book.serie = {
      name: serieInfoFromFilename.name,
      number: serieInfoFromFilename.number,
    };

    // Si un titre spécifique a été extrait, remplacer le titre générique
    if (serieInfoFromFilename.extractedTitle) {
      book.title = serieInfoFromFilename.extractedTitle;
    }
  }

  // Recherche de métadonnées en ligne
  try {
    // Essayer d'abord avec Google Books API (priorise les éditions françaises)
    const googleBooksData = await searchGoogleBooks(
      book.title,
      book.author !== "Auteur inconnu" ? book.author : ""
    );
    if (googleBooksData) {
      updateBookWithGoogleData(book, googleBooksData);
    } else {
      // Si Google Books ne donne pas de résultat, essayer avec Open Library
      const openLibraryData = await searchOpenLibrary(
        book.title,
        book.author !== "Auteur inconnu" ? book.author : ""
      );
      if (openLibraryData) {
        updateBookWithOpenLibraryData(book, openLibraryData);
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la recherche de métadonnées pour ${book.title}:`,
      error.message
    );
  }

  // Génération d'un identifiant de couverture si aucune n'a été trouvée
  if (!book.cover) {
    book.cover = await generatePlaceholderCover(book);
  }

  return book;
}

// Extraire le nom du fichier sans extension
function getNameWithoutExtension(filename) {
  return path.basename(filename, path.extname(filename));
}

// Extraire l'extension du fichier
function getFileExtension(filename) {
  return path.extname(filename).replace(".", "");
}

// Extraire le genre à partir du chemin du fichier
function extractGenreFromPath(filePath) {
  // Liste des genres communs à rechercher dans le chemin
  const genreKeywords = {
    "science-fiction": "Science-Fiction",
    sciencefiction: "Science-Fiction",
    "sci-fi": "Science-Fiction",
    scifi: "Science-Fiction",
    sf: "Science-Fiction",
    fantasy: "Fantasy",
    fantastique: "Fantastique",
    policier: "Policier",
    thriller: "Thriller",
    mystere: "Mystère",
    mystère: "Mystère",
    romance: "Romance",
    historique: "Historique",
    histoire: "Historique",
    biographie: "Biographie",
    bio: "Biographie",
    autobiographie: "Autobiographie",
    jeunesse: "Jeunesse",
    enfant: "Jeunesse",
    bd: "Bande Dessinée",
    "bande-dessinee": "Bande Dessinée",
    "bande dessinee": "Bande Dessinée",
    manga: "Manga",
    comics: "Comics",
    poesie: "Poésie",
    théâtre: "Théâtre",
    theatre: "Théâtre",
    essai: "Essai",
    philosophie: "Philosophie",
    religion: "Religion",
    spiritualite: "Spiritualité",
    spiritualité: "Spiritualité",
    art: "Art",
    cuisine: "Cuisine",
    voyage: "Voyage",
    guide: "Guide",
    sante: "Santé",
    santé: "Santé",
    "bien-etre": "Bien-être",
    "bien-être": "Bien-être",
    "developpement personnel": "Développement Personnel",
    "développement personnel": "Développement Personnel",
    economie: "Économie",
    économie: "Économie",
    politique: "Politique",
    droit: "Droit",
    informatique: "Informatique",
    technique: "Technique",
    science: "Science",
    education: "Éducation",
    éducation: "Éducation",
    horreur: "Horreur",
    epouvante: "Horreur",
    épouvante: "Horreur",
    aventure: "Aventure",
    western: "Western",
    guerre: "Guerre",
    espionnage: "Espionnage",
    dystopie: "Dystopie",
    utopie: "Utopie",
    erotique: "Érotique",
    érotique: "Érotique",
    humour: "Humour",
    comedie: "Comédie",
    comédie: "Comédie",
    drame: "Drame",
    tragédie: "Tragédie",
    tragedie: "Tragédie",
    conte: "Conte",
    fable: "Fable",
    mythologie: "Mythologie",
    légende: "Légende",
    legende: "Légende",
    nouvelle: "Nouvelle",
    recueil: "Recueil",
    anthologie: "Anthologie",
    dictionnaire: "Dictionnaire",
    encyclopedie: "Encyclopédie",
    encyclopédie: "Encyclopédie",
    manuel: "Manuel",
    scolaire: "Scolaire",
    universitaire: "Universitaire",
    academique: "Académique",
    académique: "Académique",
  };

  // Normaliser le chemin (minuscules, sans accents)
  const normalizedPath = filePath
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Diviser le chemin en segments
  const pathSegments = normalizedPath.split(path.sep);

  // Parcourir les segments du chemin pour trouver un genre
  for (const segment of pathSegments) {
    // Vérifier si le segment correspond à un genre connu
    for (const [keyword, genreName] of Object.entries(genreKeywords)) {
      if (segment === keyword || segment.includes(keyword)) {
        return genreName;
      }
    }
  }

  return null;
}

// Extraire l'auteur du nom de fichier si possible
function extractAuthorFromFilename(filename) {
  const name = getNameWithoutExtension(filename);

  // Patterns courants pour les noms de fichiers de livres
  const patterns = [
    // Pattern: Titre - Auteur.ext
    /^(.+)\s+-\s+(.+)$/,
    // Pattern: Auteur - Titre.ext
    /^([^\d]+?)\s+-\s+(.+)$/,
    // Pattern: Titre [Auteur].ext ou Titre (Auteur).ext
    /^.+\s+[\[\(]([^\[\(\]\)]+)[\]\)]$/,
    // Pattern: Auteur - [Série] - Titre.ext
    /^([^\d-]+?)\s+-\s+\[[^\]]+\]\s+-\s+.+$/,
    // Pattern: Titre.Auteur.ext (séparé par des points)
    /^.+\.([^.]+\s+[^.]+)\.[^.]+$/,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      // Vérifier que l'auteur extrait semble valide (au moins 2 caractères, pas juste des chiffres)
      const potentialAuthor = match[1].trim();
      if (potentialAuthor.length > 2 && !/^\d+$/.test(potentialAuthor)) {
        return potentialAuthor;
      }
    }
  }

  return null;
}

// Extraire les informations de série depuis le nom de fichier
function extractSerieInfoFromFilename(filename) {
  const name = getNameWithoutExtension(filename);

  // Patterns courants pour les noms de fichiers de livres en série
  const patterns = [
    // Pattern: [Série X] Titre.ext ou (Série X) Titre.ext
    /^\s*[\[\(]([^\d\]\)]+)\s+(\d+)[\]\)]\s*(.+)$/i,
    // Pattern: Série - Tome X - Titre.ext
    /^([^-]+)\s*-\s*(?:Tome|T|Livre|L|Volume|Vol)\s*(\d+)\s*-\s*(.+)$/i,
    // Pattern: Série Tome X - Titre.ext
    /^([^\d]+)\s*(?:Tome|T|Livre|L|Volume|Vol)\s*(\d+)\s*-\s*(.+)$/i,
    // Pattern: Série T.X - Titre.ext ou Série T.X : Titre.ext
    /^([^\d]+)\s*(?:T|L|Vol)\.\s*(\d+)\s*[:-]\s*(.+)$/i,
    // Pattern: Série X - Titre.ext (où X est un nombre)
    /^([^\d]+)\s*(\d+)\s*[:-]\s*(.+)$/i,
    // Pattern: Titre - Série X.ext
    /^(.+)\s*-\s*([^\d-]+)\s*(\d+)$/i,
    // Pattern: Série.X.Titre.ext (séparé par des points)
    /^([^\d\.]+)\.(\d+)\.(.+)$/i,
    // Pattern: Titre X - Série.ext (ex: Harry Potter 2 - La Chambre des Secrets)
    /^([^\d]+)\s*(\d+)\s*-\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      // Selon le pattern, l'ordre des groupes peut varier
      // Certains patterns ont la série en premier groupe, d'autres en dernier
      let serieName, serieNumber, title;

      // Déterminer quel groupe contient quoi selon le pattern
      if (pattern.toString().includes("\\s*[\\[\\(")) {
        // Pattern: [Série X] Titre
        serieName = match[1].trim();
        serieNumber = parseInt(match[2], 10);
        title = match[3] ? match[3].trim() : null;
      } else if (pattern.toString().includes("Tome|T|Livre")) {
        // Pattern: Série - Tome X - Titre
        serieName = match[1].trim();
        serieNumber = parseInt(match[2], 10);
        title = match[3] ? match[3].trim() : null;
      } else if (pattern.toString().includes("T\\.")) {
        // Pattern: Série T.X - Titre
        serieName = match[1].trim();
        serieNumber = parseInt(match[2], 10);
        title = match[3] ? match[3].trim() : null;
      } else if (pattern.toString().includes("\\s*-\\s*([^\\d-]+)")) {
        // Pattern: Titre - Série X
        title = match[1].trim();
        serieName = match[2].trim();
        serieNumber = parseInt(match[3], 10);
      } else {
        // Autres patterns
        serieName = match[1].trim();
        serieNumber = parseInt(match[2], 10);
        title = match[3] ? match[3].trim() : null;
      }

      // Vérifier que les informations extraites semblent valides
      if (
        serieName &&
        serieName.length > 2 &&
        !isNaN(serieNumber) &&
        serieNumber > 0
      ) {
        return {
          name: serieName,
          number: serieNumber,
          extractedTitle: title,
        };
      }
    }
  }

  // Cas spécial pour les noms de fichiers qui contiennent juste un numéro à la fin
  // Ex: "Harry Potter 1.epub", "Le Seigneur des Anneaux 2.pdf"
  const simpleNumberMatch = name.match(/^([^\d]+)\s*(\d+)$/i);
  if (simpleNumberMatch) {
    const potentialSerieName = simpleNumberMatch[1].trim();
    const potentialNumber = parseInt(simpleNumberMatch[2], 10);

    if (
      potentialSerieName.length > 2 &&
      !isNaN(potentialNumber) &&
      potentialNumber > 0
    ) {
      return {
        name: potentialSerieName,
        number: potentialNumber,
        extractedTitle: null, // Pas de titre spécifique extrait
      };
    }
  }

  return null;
}

// Recherche dans Google Books API (avec priorité aux éditions françaises)
async function searchGoogleBooks(title, author = "", retryCount = 0) {
  try {
    // Vérifier si la clé API est définie
    if (!CONFIG.googleBooksApiKey) {
      console.warn(
        "Aucune clé API Google Books définie. Les résultats peuvent être limités."
      );
    }

    // Générer une clé de cache unique pour cette recherche
    const cacheKey = generateCacheKey(title, author);

    // Vérifier si les résultats sont déjà dans le cache
    if (apiCache.googleBooks && apiCache.googleBooks[cacheKey]) {
      console.log(`Utilisation du cache pour "${title}" (Google Books)`);
      return apiCache.googleBooks[cacheKey];
    }

    // Ajouter un délai avant l'appel API pour éviter les limitations
    await delay(CONFIG.apiRequestDelay);

    // Si pas dans le cache, faire l'appel API
    console.log(`Recherche API pour "${title}" (Google Books)`);
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `intitle:"${title.replace(/"/g, "")}"${
            author ? ` inauthor:"${author.replace(/"/g, "")}"` : ""
          }`,
          langRestrict: "fr",
          maxResults: CONFIG.maxResults,
          key: CONFIG.googleBooksApiKey,
        },
        timeout: 10000, // Timeout de 10 secondes
      }
    );

    let result = null;

    if (response.data.items && response.data.items.length > 0) {
      // Filtrer pour trouver une édition française
      const frenchEditions = response.data.items.filter((item) => {
        const volumeInfo = item.volumeInfo || {};
        return (
          volumeInfo.language === "fr" ||
          (volumeInfo.publisher && isFrenchPublisher(volumeInfo.publisher))
        );
      });

      if (frenchEditions.length > 0) {
        result = frenchEditions[0];
      } else {
        // Si aucune édition française n'est trouvée, retourner le premier résultat
        result = response.data.items[0];
      }
    }

    // Stocker le résultat dans le cache (même si null)
    apiCache.googleBooks[cacheKey] = result;
    // Sauvegarder le cache périodiquement (toutes les 50 entrées pour éviter trop d'écritures disque)
    if (Object.keys(apiCache.googleBooks).length % 50 === 0) {
      saveApiCache();
    }

    return result;
  } catch (error) {
    // Gestion spécifique des erreurs
    if (error.response) {
      const status = error.response.status;

      if (status === 403) {
        console.error(
          "Erreur 403: Clé API Google Books invalide ou problème d'autorisation"
        );
        return null;
      } else if (status === 429 && retryCount < CONFIG.maxRetries) {
        console.warn(
          `Trop de requêtes (429), nouvelle tentative ${retryCount + 1}/${
            CONFIG.maxRetries
          } dans ${CONFIG.retryDelay / 1000}s...`
        );
        await delay(CONFIG.retryDelay);
        return searchGoogleBooks(title, author, retryCount + 1);
      }
    }

    console.error("Erreur lors de la recherche Google Books:", error.message);
    return null;
  }
}

// Vérifier si l'éditeur semble être français
function isFrenchPublisher(publisher) {
  const frenchPublishers = [
    "gallimard",
    "hachette",
    "flammarion",
    "actes sud",
    "seuil",
    "albin michel",
    "grasset",
    "pocket",
    "j'ai lu",
    "folio",
    "plon",
    "robert laffont",
    "éditions",
    "larousse",
    "nathan",
    "denoël",
    "fayard",
    "minuit",
    "belfond",
    "stock",
    "puf",
  ];

  const publisherLower = publisher.toLowerCase();
  return frenchPublishers.some((fp) => publisherLower.includes(fp));
}

// Mise à jour des métadonnées du livre avec les données de Google Books
function updateBookWithGoogleData(book, googleData) {
  const volumeInfo = googleData.volumeInfo || {};

  if (volumeInfo.title) book.title = volumeInfo.title;
  if (volumeInfo.authors && volumeInfo.authors.length > 0) {
    book.author = volumeInfo.authors.join(", ");
  }

  if (volumeInfo.description) {
    book.summary = volumeInfo.description;
  }

  if (volumeInfo.categories && volumeInfo.categories.length > 0) {
    book.genre = volumeInfo.categories[0];
  }

  if (volumeInfo.language) {
    book.language = volumeInfo.language;
  }

  if (volumeInfo.publisher) {
    book.publisher = volumeInfo.publisher;
  }

  if (volumeInfo.publishedDate) {
    book.publishedDate = volumeInfo.publishedDate;
  }

  // Extraction des informations de série depuis Google Books
  const serieInfo = extractSerieInfoFromGoogleBooks(volumeInfo);
  if (serieInfo) {
    book.serie = serieInfo;
  }

  // Gestion de la couverture
  if (
    volumeInfo.imageLinks &&
    (volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail)
  ) {
    const imageUrl =
      volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
    book.cover = generateCoverFromUrl(imageUrl, book.id);
  }
}

// Extraire les informations de série depuis les données Google Books
function extractSerieInfoFromGoogleBooks(volumeInfo) {
  // Vérifier si les données contiennent des informations de série
  if (volumeInfo.seriesInfo) {
    return {
      name: volumeInfo.seriesInfo.title || volumeInfo.seriesInfo.name,
      number:
        volumeInfo.seriesInfo.bookOrderInSeries ||
        volumeInfo.seriesInfo.volumeNumber ||
        1,
    };
  }

  // Certaines API renvoient les infos de série dans un format différent
  if (volumeInfo.series && volumeInfo.series.length > 0) {
    return {
      name: volumeInfo.series[0],
      number: volumeInfo.seriesPosition || volumeInfo.volumeNumber || 1,
    };
  }

  // Parfois les informations de série sont dans le sous-titre
  if (volumeInfo.subtitle) {
    // Rechercher des patterns comme "Tome 3 de la série XYZ" ou "XYZ, vol. 2"
    const subtitleSerieMatch = volumeInfo.subtitle.match(
      /(?:Tome|Livre|Volume|Vol\.?)\s*(\d+)\s*(?:de|of|from)?\s*(?:la|the)?\s*(?:série|series)?\s*([^,\.]+)/i
    );

    if (subtitleSerieMatch) {
      return {
        name: subtitleSerieMatch[2].trim(),
        number: parseInt(subtitleSerieMatch[1], 10),
      };
    }

    // Pattern inverse: "XYZ, tome 3"
    const serieFirstMatch = volumeInfo.subtitle.match(
      /([^,\.]+)\s*,\s*(?:tome|livre|volume|vol\.?)\s*(\d+)/i
    );

    if (serieFirstMatch) {
      return {
        name: serieFirstMatch[1].trim(),
        number: parseInt(serieFirstMatch[2], 10),
      };
    }
  }

  // Parfois les informations de série sont dans le titre lui-même
  if (volumeInfo.title) {
    // Rechercher des patterns comme "Harry Potter et la Chambre des Secrets (Tome 2)" ou "Le Trône de Fer, Tome 1"
    const titleSerieMatch = volumeInfo.title.match(
      /^([^,\(\)]+)(?:\s*[,\(]\s*(?:Tome|Livre|Volume|Vol\.?)\s*(\d+)[\)\,])/i
    );

    if (titleSerieMatch) {
      return {
        name: titleSerieMatch[1].trim(),
        number: parseInt(titleSerieMatch[2], 10),
      };
    }
  }

  return null;
}

// Recherche dans Open Library API
async function searchOpenLibrary(title, author = "", retryCount = 0) {
  try {
    // Générer une clé de cache unique pour cette recherche
    const cacheKey = generateCacheKey(title, author);

    // Vérifier si les résultats sont déjà dans le cache
    if (apiCache.openLibrary && apiCache.openLibrary[cacheKey]) {
      console.log(`Utilisation du cache pour "${title}" (Open Library)`);
      return apiCache.openLibrary[cacheKey];
    }

    // Ajouter un délai avant l'appel API pour éviter les limitations
    await delay(CONFIG.apiRequestDelay);

    // Si pas dans le cache, faire l'appel API
    console.log(`Recherche API pour "${title}" (Open Library)`);
    const response = await axios.get(CONFIG.openLibrarySearchUrl, {
      params: {
        title: `"${title.replace(/"/g, "")}"`,
        author: author ? `"${author.replace(/"/g, "")}"` : undefined,
        limit: CONFIG.maxResults,
        language: "fre", // Ajouter un filtre de langue pour les éditions françaises
      },
      timeout: 10000, // Timeout de 10 secondes
    });

    let result = null;

    if (response.data.docs && response.data.docs.length > 0) {
      // Filtrer pour trouver une édition française
      const frenchEditions = response.data.docs.filter((doc) => {
        return doc.language && doc.language.includes("fre");
      });

      if (frenchEditions.length > 0) {
        result = frenchEditions[0];
      } else {
        // Si aucune édition française n'est trouvée, retourner le premier résultat
        result = response.data.docs[0];
      }
    }

    // Stocker le résultat dans le cache (même si null)
    apiCache.openLibrary[cacheKey] = result;
    // Sauvegarder le cache périodiquement (toutes les 50 entrées pour éviter trop d'écritures disque)
    if (Object.keys(apiCache.openLibrary).length % 50 === 0) {
      saveApiCache();
    }

    return result;
  } catch (error) {
    // Gestion spécifique des erreurs
    if (error.response) {
      const status = error.response.status;

      if (status === 429 && retryCount < CONFIG.maxRetries) {
        console.warn(
          `Trop de requêtes Open Library (429), nouvelle tentative ${
            retryCount + 1
          }/${CONFIG.maxRetries} dans ${CONFIG.retryDelay / 1000}s...`
        );
        await delay(CONFIG.retryDelay);
        return searchOpenLibrary(title, author, retryCount + 1);
      }
    }

    console.error("Erreur lors de la recherche Open Library:", error.message);
    return null;
  }
}

// Mise à jour du livre avec les données d'Open Library
function updateBookWithOpenLibraryData(book, openLibraryData) {
  if (openLibraryData.title) book.title = openLibraryData.title;
  if (openLibraryData.author_name && openLibraryData.author_name.length > 0) {
    book.author = openLibraryData.author_name.join(", ");
  }

  if (openLibraryData.subject && openLibraryData.subject.length > 0) {
    book.genre = openLibraryData.subject[0];
  }

  if (openLibraryData.language) {
    // Convertir le code langue 'fre' en 'fr'
    if (openLibraryData.language.includes("fre")) {
      book.language = "fr";
    }
  }

  if (openLibraryData.publisher && openLibraryData.publisher.length > 0) {
    book.publisher = openLibraryData.publisher[0];
  }

  if (openLibraryData.publish_date && openLibraryData.publish_date.length > 0) {
    book.publishedDate = openLibraryData.publish_date[0];
  }

  // Extraction des informations de série depuis Open Library
  const serieInfo = extractSerieInfoFromOpenLibrary(openLibraryData);
  if (serieInfo) {
    book.serie = serieInfo;
  }

  // Couverture Open Library
  if (openLibraryData.cover_i) {
    const imageUrl = `https://covers.openlibrary.org/b/id/${openLibraryData.cover_i}-L.jpg`;
    book.cover = generateCoverFromUrl(imageUrl, book.id);
  }
}

// Extraire les informations de série depuis les données Open Library
function extractSerieInfoFromOpenLibrary(openLibraryData) {
  // Vérifier si les données contiennent des informations de série explicites
  if (openLibraryData.series && openLibraryData.series.length > 0) {
    let serieName = openLibraryData.series[0];
    let serieNumber = 1; // Par défaut si non spécifié

    // Essayer de trouver le numéro dans le titre ou la description
    if (openLibraryData.title) {
      const numberMatch = openLibraryData.title.match(
        /(?:tome|livre|volume|vol\.?)\s*(\d+)/i
      );
      if (numberMatch) {
        serieNumber = parseInt(numberMatch[1], 10);
      }
    }

    return {
      name: serieName,
      number: serieNumber,
    };
  }

  // Vérifier dans le titre s'il contient des informations de série
  if (openLibraryData.title) {
    // Pattern: "Série - Tome X" ou "Série, Tome X"
    const titleSerieMatch = openLibraryData.title.match(
      /^([^-,]+)\s*[-,]\s*(?:Tome|Livre|Volume|Vol\.?)\s*(\d+)/i
    );

    if (titleSerieMatch) {
      return {
        name: titleSerieMatch[1].trim(),
        number: parseInt(titleSerieMatch[2], 10),
      };
    }

    // Pattern: "Titre (Série X)" ou "Titre [Série X]"
    const serieInParenthesesMatch = openLibraryData.title.match(
      /^.+\s*[\(\[]\s*([^\d\(\)\[\]]+)\s*(\d+)\s*[\)\]]$/i
    );

    if (serieInParenthesesMatch) {
      return {
        name: serieInParenthesesMatch[1].trim(),
        number: parseInt(serieInParenthesesMatch[2], 10),
      };
    }
  }

  return null;
}

// Fonction pour générer une couverture à partir d'une URL
async function generateCoverFromUrl(url, bookId) {
  if (!url) return null;

  // Créer un objet livre temporaire avec l'ID fourni
  const tempBook = { id: bookId };

  // Appeler downloadCover pour télécharger et traiter l'image
  await downloadCover(url, tempBook);

  // Retourner le chemin de la couverture mis à jour par downloadCover
  return tempBook.cover;
}

// Téléchargement et sauvegarde de la couverture
async function downloadCover(url, book) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const coverFileName = `${book.id}.jpg`;
    const coverPath = path.join(CONFIG.coverOutputDir, coverFileName);

    // Optimiser et sauvegarder l'image
    await sharp(response.data)
      .resize(500, 750, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(coverPath);

    // Mettre à jour le chemin de la couverture dans le livre
    book.cover = `/data/covers/${coverFileName}`;
  } catch (error) {
    console.error(
      `Erreur lors du téléchargement de la couverture pour ${book.title}:`,
      error.message
    );
    // Set book.cover to null when an error occurs to avoid undefined behavior
    book.cover = null;
  }
}

// Génération d'une couverture placeholder
async function generatePlaceholderCover(book) {
  try {
    const coverFileName = `${book.id}.jpg`;
    const coverPath = path.join(CONFIG.coverOutputDir, coverFileName);

    // Créer une image de base avec le titre et l'auteur
    const titleLines = wrapText(book.title, 20);
    const authorText = book.author !== "Auteur inconnu" ? book.author : "";

    const svgImage = `
      <svg width="500" height="750" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="750" fill="#2a2a2a"/>
        <rect width="480" height="730" x="10" y="10" fill="#3a3a3a" rx="5" ry="5"/>
        <text x="250" y="375" font-family="Arial" font-size="32" fill="white" text-anchor="middle">
          ${titleLines
            .map(
              (line, i) =>
                `<tspan x="250" dy="${i === 0 ? 0 : 40}">${line}</tspan>`
            )
            .join("")}
        </text>
        <text x="250" y="500" font-family="Arial" font-size="24" fill="#cccccc" text-anchor="middle">${authorText}</text>
        <text x="250" y="700" font-family="Arial" font-size="18" fill="#999999" text-anchor="middle">${book.fileType.toUpperCase()}</text>
      </svg>
    `;

    await sharp(Buffer.from(svgImage)).jpeg({ quality: 80 }).toFile(coverPath);

    return `/data/covers/${coverFileName}`;
  } catch (error) {
    console.error(
      `Erreur lors de la génération de la couverture pour ${book.title}:`,
      error.message
    );
    return null; // Return null instead of empty string to avoid browser reload issues
  }
}

// Fonction pour wrapper le texte
function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 4); // Limiter à 4 lignes maximum
}

// Exécution du script
main();

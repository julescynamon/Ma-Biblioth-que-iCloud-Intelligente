/**
 * Script pour diviser le catalogue en plusieurs fichiers JSON par genre
 * 
 * Ce script lit le catalogue principal et crée:
 * 1. Un fichier index.json contenant les métadonnées et la liste des genres
 * 2. Un fichier par genre contenant uniquement les livres de ce genre
 * 3. Un fichier pagination.json pour faciliter le chargement par lots
 */

import fs from 'fs';
import path from 'path';

// Nous utilisons process.cwd() pour obtenir le chemin racine du projet
// ce qui est plus approprié pour accéder aux fichiers dans le projet

// Chemins des fichiers
const SOURCE_FILE = path.join(process.cwd(), 'public', 'data', 'catalogue.json');
const TARGET_DIR = path.join(process.cwd(), 'public', 'data', 'catalogue');
const INDEX_FILE = path.join(TARGET_DIR, 'index.json');
const PAGINATION_FILE = path.join(TARGET_DIR, 'pagination.json');
const BOOKS_PER_PAGE = 24; // Correspond à la pagination actuelle dans l'UI

// Création du répertoire cible s'il n'existe pas
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`Répertoire créé: ${TARGET_DIR}`);
}

// Lecture du catalogue source
console.log('Lecture du catalogue source...');
const catalogue = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const { books, lastUpdated } = catalogue;

console.log(`Catalogue chargé: ${books.length} livres`);

// Extraction des genres
const genreMap = new Map();
books.forEach(book => {
  const genre = book.genre || 'Non classé';
  if (!genreMap.has(genre)) {
    genreMap.set(genre, []);
  }
  genreMap.get(genre).push(book);
});

// Création de l'index des genres
const genres = Array.from(genreMap.entries()).map(([name, books]) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  count: books.length,
  file: `${name.toLowerCase().replace(/\s+/g, '-')}.json`
})).sort((a, b) => b.count - a.count);

// Écriture du fichier d'index
const index = {
  lastUpdated,
  totalBooks: books.length,
  genres
};

fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
console.log(`Index écrit: ${INDEX_FILE}`);

// Écriture des fichiers par genre
genres.forEach(genre => {
  const genreBooks = genreMap.get(genre.name);
  const genreFile = path.join(TARGET_DIR, genre.file);
  
  fs.writeFileSync(genreFile, JSON.stringify({
    genre: genre.name,
    count: genreBooks.length,
    books: genreBooks
  }, null, 2));
  
  console.log(`Genre écrit: ${genre.name} (${genreBooks.length} livres)`);
});

// Création des fichiers de pagination (pour le chargement par lots)
const totalPages = Math.ceil(books.length / BOOKS_PER_PAGE);
const paginationIndex = {
  totalBooks: books.length,
  booksPerPage: BOOKS_PER_PAGE,
  totalPages,
  pages: Array.from({ length: totalPages }, (_, i) => ({
    page: i + 1,
    file: `page-${i + 1}.json`
  }))
};

fs.writeFileSync(PAGINATION_FILE, JSON.stringify(paginationIndex, null, 2));
console.log(`Index de pagination écrit: ${PAGINATION_FILE}`);

// Écriture des fichiers de pagination
for (let i = 0; i < totalPages; i++) {
  const pageNumber = i + 1;
  const pageBooks = books.slice(i * BOOKS_PER_PAGE, (i + 1) * BOOKS_PER_PAGE);
  const pageFile = path.join(TARGET_DIR, `page-${pageNumber}.json`);
  
  fs.writeFileSync(pageFile, JSON.stringify({
    page: pageNumber,
    totalPages,
    count: pageBooks.length,
    books: pageBooks
  }, null, 2));
  
  console.log(`Page écrite: ${pageNumber} (${pageBooks.length} livres)`);
}

// Création d'un fichier pour les livres "à lire"
const toReadBooks = books.filter(book => book.toRead);
if (toReadBooks.length > 0) {
  const toReadFile = path.join(TARGET_DIR, 'to-read.json');
  fs.writeFileSync(toReadFile, JSON.stringify({
    count: toReadBooks.length,
    books: toReadBooks
  }, null, 2));
  console.log(`Livres "à lire" écrits: ${toReadBooks.length} livres`);
}

console.log('Découpage du catalogue terminé avec succès!');

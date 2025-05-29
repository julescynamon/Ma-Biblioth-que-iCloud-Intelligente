import { Book } from '@/types';

export interface Collection {
  id: string;        // Identifiant unique de la collection
  name: string;      // Nom de la collection (nom de série, auteur ou genre)
  type: 'series' | 'author' | 'genre'; // Type de collection
  books: Book[];     // Livres dans la collection
  count: number;     // Nombre de livres
}

/**
 * Regroupe les livres par série
 * @param books Liste de tous les livres
 * @returns Collections de livres par série
 */
export function groupBooksBySeries(books: Book[]): Collection[] {
  const seriesMap = new Map<string, Book[]>();
  
  // Parcourir tous les livres
  books.forEach((book) => {
    if (book.serie && book.serie.name) {
      // Normaliser le nom de la série (minuscules, sans espaces)
      const normalizedName = book.serie.name.toLowerCase().trim();
      const key = `series-${normalizedName}`;
      
      // Ajouter le livre à sa série
      if (!seriesMap.has(key)) {
        seriesMap.set(key, []);
      }
      seriesMap.get(key)!.push(book);
    }
  });

  // Convertir la map en tableau de collections
  return Array.from(seriesMap.entries())
    .map(([key, seriesBooks]) => ({
      id: key,
      name: seriesBooks[0].serie!.name, // Utiliser le nom original
      type: 'series' as const,
      books: seriesBooks.sort((a, b) => {
        // Trier par numéro de série
        const aNumber = a.serie?.number || 0;
        const bNumber = b.serie?.number || 0;
        return aNumber - bNumber;
      }),
      count: seriesBooks.length
    }))
    // Trier les séries par nombre de livres (décroissant)
    .sort((a, b) => b.count - a.count);
}

/**
 * Regroupe les livres par auteur
 * @param books Liste de tous les livres
 * @param excludeSeriesBooks Exclure les livres déjà dans une série
 * @returns Collections de livres par auteur
 */
export function groupBooksByAuthor(books: Book[], excludeSeriesBooks: boolean = false): Collection[] {
  const authorMap = new Map<string, Book[]>();
  
  // Parcourir tous les livres
  books.forEach((book) => {
    // Ignorer les livres déjà dans une série si demandé
    if (excludeSeriesBooks && book.serie && book.serie.name) {
      return;
    }
    
    if (book.author && book.author !== 'Auteur inconnu') {
      // Normaliser le nom de l'auteur (minuscules, sans espaces)
      const normalizedName = book.author.toLowerCase().trim();
      const key = `author-${normalizedName}`;
      
      // Ajouter le livre à son auteur
      if (!authorMap.has(key)) {
        authorMap.set(key, []);
      }
      authorMap.get(key)!.push(book);
    }
  });

  // Convertir la map en tableau de collections
  return Array.from(authorMap.entries())
    .filter(([_, authorBooks]) => authorBooks.length >= 2) // Au moins 2 livres par auteur
    .map(([key, authorBooks]) => ({
      id: key,
      name: authorBooks[0].author, // Utiliser le nom original
      type: 'author' as const,
      books: authorBooks.sort((a, b) => a.title.localeCompare(b.title)), // Tri alphabétique
      count: authorBooks.length
    }))
    // Trier les auteurs par nombre de livres (décroissant)
    .sort((a, b) => b.count - a.count);
}

/**
 * Regroupe les livres par genre
 * @param books Liste de tous les livres
 * @param excludeSeriesBooks Exclure les livres déjà dans une série
 * @returns Collections de livres par genre
 */
export function groupBooksByGenre(books: Book[], excludeSeriesBooks: boolean = false): Collection[] {
  const genreMap = new Map<string, Book[]>();
  
  // Parcourir tous les livres
  books.forEach((book) => {
    // Ignorer les livres déjà dans une série si demandé
    if (excludeSeriesBooks && book.serie && book.serie.name) {
      return;
    }
    
    if (book.genre && book.genre !== 'Non classé') {
      // Normaliser le nom du genre (minuscules, sans espaces)
      const normalizedName = book.genre.toLowerCase().trim();
      const key = `genre-${normalizedName}`;
      
      // Ajouter le livre à son genre
      if (!genreMap.has(key)) {
        genreMap.set(key, []);
      }
      genreMap.get(key)!.push(book);
    }
  });

  // Convertir la map en tableau de collections
  return Array.from(genreMap.entries())
    .filter(([_, genreBooks]) => genreBooks.length >= 3) // Au moins 3 livres par genre
    .map(([key, genreBooks]) => ({
      id: key,
      name: genreBooks[0].genre, // Utiliser le nom original
      type: 'genre' as const,
      books: genreBooks.sort((a, b) => a.title.localeCompare(b.title)), // Tri alphabétique
      count: genreBooks.length
    }))
    // Trier les genres par nombre de livres (décroissant)
    .sort((a, b) => b.count - a.count);
}

/**
 * Récupère les livres qui ne sont pas dans une collection
 * @param books Liste de tous les livres
 * @param collections Collections existantes
 * @returns Livres sans collection
 */
export function getUncategorizedBooks(books: Book[], collections: Collection[]): Book[] {
  // Créer un Set de tous les IDs de livres dans les collections
  const collectionBookIds = new Set<string>();
  collections.forEach(collection => {
    collection.books.forEach(book => {
      collectionBookIds.add(book.id);
    });
  });
  
  // Filtrer les livres qui ne sont pas dans une collection
  return books.filter(book => !collectionBookIds.has(book.id))
    .sort((a, b) => a.title.localeCompare(b.title)); // Tri alphabétique
}

import { Book } from '@/types';

interface SeriesGroup {
  name: string;
  books: Book[];
}

/**
 * Regroupe les livres par série
 * @param books Liste de tous les livres
 * @returns Un objet contenant les livres regroupés par série et les livres sans série
 */
export function groupBooksBySeries(books: Book[]): {
  seriesGroups: SeriesGroup[];
  nonSeriesBooks: Book[];
} {
  const seriesMap = new Map<string, Book[]>();
  const nonSeriesBooks: Book[] = [];

  // Parcourir tous les livres
  books.forEach((book) => {
    if (book.serie && book.serie.name) {
      // Normaliser le nom de la série (minuscules, sans espaces)
      const normalizedName = book.serie.name.toLowerCase().trim();
      
      // Ajouter le livre à sa série
      if (!seriesMap.has(normalizedName)) {
        seriesMap.set(normalizedName, []);
      }
      seriesMap.get(normalizedName)!.push(book);
    } else {
      // Livre sans série
      nonSeriesBooks.push(book);
    }
  });

  // Convertir la map en tableau de groupes
  const seriesGroups: SeriesGroup[] = Array.from(seriesMap.entries())
    .map(([normalizedName, books]) => ({
      // Utiliser le nom de série du premier livre (avec la casse d'origine)
      name: books[0].serie!.name,
      books
    }))
    // Trier les séries par nombre de livres (décroissant)
    .sort((a, b) => b.books.length - a.books.length);

  return {
    seriesGroups,
    nonSeriesBooks
  };
}

/**
 * Vérifie si une série a suffisamment de livres pour être affichée comme une série
 * @param seriesBooks Livres d'une série
 * @param minBooksInSeries Nombre minimum de livres pour considérer comme une série
 * @returns true si la série a suffisamment de livres
 */
export function isValidSeries(seriesBooks: Book[], minBooksInSeries: number = 2): boolean {
  return seriesBooks.length >= minBooksInSeries;
}

import { Book, Catalogue, Genre, SortOption } from '@/types';

// Cache pour stocker les résultats
let catalogueCache: Catalogue | null = null;

/**
 * Lecture du catalogue côté serveur (SSG/SSR) depuis le fichier public/data/catalogue.json
 */
export async function getCatalogueStatic(): Promise<Catalogue> {
  try {
    // Cette fonction est appelée côté serveur uniquement
    if (typeof window === 'undefined') {
      // Imports dynamiques pour éviter les erreurs côté client
      const path = await import('path');
      const fs = await import('fs/promises');
      
      const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } else {
      // Fallback pour le client
      return await getCatalogue();
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du catalogue statique:', error);
    return { lastUpdated: '', books: [] };
  }
}

let genresCache: Genre[] | null = null;
const searchCache = new Map<string, Book[]>();

export const getCatalogue = async (): Promise<Catalogue> => {
  // Utiliser le cache si disponible
  if (catalogueCache) {
    return catalogueCache;
  }

  try {
    const response = await fetch('/data/catalogue.json');
    if (!response.ok) {
      throw new Error('Failed to fetch catalogue');
    }
    const data = await response.json();
    // Stocker dans le cache
    catalogueCache = data;
    return data;
  } catch (error) {
    console.error('Error loading catalogue:', error);
    return { lastUpdated: '', books: [] };
  }
};

export const getBook = async (id: string): Promise<Book | null> => {
  try {
    const catalogue = await getCatalogue();
    return catalogue.books.find(book => book.id === id) || null;
  } catch (error) {
    console.error('Error getting book:', error);
    return null;
  }
};

export const getGenres = async (): Promise<Genre[]> => {
  // Utiliser le cache si disponible
  if (genresCache) {
    return genresCache;
  }

  try {
    const catalogue = await getCatalogue();
    const genreMap = new Map<string, number>();
    
    catalogue.books.forEach(book => {
      const count = genreMap.get(book.genre) || 0;
      genreMap.set(book.genre, count + 1);
    });
    
    const genres = Array.from(genreMap.entries())
      .map(([name, count]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);
    
    // Stocker dans le cache
    genresCache = genres;
    return genres;
  } catch (error) {
    console.error('Error getting genres:', error);
    return [];
  }
};

export const filterBooks = (
  books: Book[],
  search: string = '',
  genre: string = '',
  toRead: boolean = false
): Book[] => {
  // Créer une clé unique pour cette combinaison de filtres
  const cacheKey = `${search}|${genre}|${toRead}`;
  
  // Vérifier si nous avons déjà les résultats en cache
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }
  
  // Sinon, filtrer les livres
  const filteredBooks = books.filter(book => {
    const matchesSearch = search === '' || 
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    
    const matchesGenre = genre === '' || book.genre.toLowerCase() === genre.toLowerCase();
    
    const matchesToRead = !toRead || book.toRead;
    
    return matchesSearch && matchesGenre && matchesToRead;
  });
  
  // Stocker les résultats dans le cache
  searchCache.set(cacheKey, filteredBooks);
  
  return filteredBooks;
};

export const sortBooks = (books: Book[], sortBy: SortOption): Book[] => {
  const sortedBooks = [...books];
  
  switch (sortBy) {
    case 'title':
      return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
    case 'author':
      return sortedBooks.sort((a, b) => a.author.localeCompare(b.author));
    case 'genre':
      return sortedBooks.sort((a, b) => a.genre.localeCompare(b.genre));
    case 'date':
      return sortedBooks.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
    default:
      return sortedBooks;
  }
};

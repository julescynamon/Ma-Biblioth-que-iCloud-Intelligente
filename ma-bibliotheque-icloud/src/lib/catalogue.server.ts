import { Catalogue, Book, Genre, CatalogueIndex, GenreCatalogue, PaginatedCatalogue } from '@/types';
import fs from 'fs/promises';
import path from 'path';

/**
 * Lecture de l'index du catalogue (métadonnées et liste des genres)
 */
export async function getCatalogueIndex(): Promise<CatalogueIndex> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue', 'index.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'index du catalogue:', error);
    return { lastUpdated: '', totalBooks: 0, genres: [] };
  }
}

/**
 * Lecture des livres d'un genre spécifique
 */
export async function getGenreCatalogue(genreId: string): Promise<GenreCatalogue> {
  try {
    // Récupérer d'abord l'index pour trouver le fichier correspondant au genre
    const index = await getCatalogueIndex();
    const genre = index.genres.find(g => g.id === genreId);
    
    if (!genre) {
      throw new Error(`Genre non trouvé: ${genreId}`);
    }
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue', genre.file);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erreur lors de la lecture du genre ${genreId}:`, error);
    return { genre: '', count: 0, books: [] };
  }
}

/**
 * Lecture d'une page spécifique de livres (pour la pagination)
 */
export async function getPageCatalogue(page: number): Promise<PaginatedCatalogue> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue', `page-${page}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erreur lors de la lecture de la page ${page}:`, error);
    return { page: page, totalPages: 0, count: 0, books: [] };
  }
}

/**
 * Lecture des livres "à lire"
 */
export async function getToReadBooks(): Promise<Book[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue', 'to-read.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const result = JSON.parse(data);
    return result.books;
  } catch (error) {
    console.error('Erreur lors de la lecture des livres "à lire":', error);
    return [];
  }
}

/**
 * Lecture du catalogue complet (compatibilité avec l'ancien code)
 * Cette fonction est plus lente car elle charge tous les livres
 */
export async function getCatalogueStatic(): Promise<Catalogue> {
  try {
    // Essayer d'abord de lire à partir des fichiers divisés
    try {
      const index = await getCatalogueIndex();
      const allBooks: Book[] = [];
      
      // Charger tous les genres
      for (const genre of index.genres) {
        const genreData = await getGenreCatalogue(genre.id);
        allBooks.push(...genreData.books);
      }
      
      return {
        lastUpdated: index.lastUpdated,
        books: allBooks
      };
    } catch (indexError) {
      console.warn('Impossible de charger le catalogue divisé, utilisation du fichier unique:', indexError);
      
      // Fallback: charger le fichier catalogue.json original
      const filePath = path.join(process.cwd(), 'public', 'data', 'catalogue.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du catalogue statique:', error);
    return { lastUpdated: '', books: [] };
  }
}

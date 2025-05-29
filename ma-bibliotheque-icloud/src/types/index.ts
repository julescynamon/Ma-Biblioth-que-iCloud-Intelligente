export interface Serie {
  name: string;
  number: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  summary: string;
  genre: string;
  language: string;
  publisher: string;
  publishedDate: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  toRead: boolean;
  addedDate: string;
  serie?: Serie;
}

export interface Catalogue {
  lastUpdated: string;
  books: Book[];
}

export type Genre = {
  id: string;
  name: string;
  count: number;
};

// Extension pour l'index du catalogue divisé
export interface GenreWithFile extends Genre {
  file: string; // Nom du fichier JSON contenant les livres de ce genre
}

// Index du catalogue (métadonnées et liste des genres)
export interface CatalogueIndex {
  lastUpdated: string;
  totalBooks: number;
  genres: GenreWithFile[];
}

// Catalogue pour un genre spécifique
export interface GenreCatalogue {
  genre: string;
  count: number;
  books: Book[];
}

// Catalogue pour une page spécifique (pagination)
export interface PaginatedCatalogue {
  page: number;
  totalPages: number;
  count: number;
  books: Book[];
}

export type SortOption = 'title' | 'author' | 'genre' | 'date';

export interface PaginationOptions {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

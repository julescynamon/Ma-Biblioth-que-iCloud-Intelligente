'use client';

import { useState, useEffect, useCallback } from 'react';
import { Book, Genre, SortOption } from '@/types';
import BookGrid from '@/components/books/BookGrid';
import NetflixLayout from '@/components/NetflixLayout';
import CollectionsView from '@/components/collections/CollectionsView';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { filterBooks, sortBooks } from '@/lib/catalogue';

interface BookExplorerClientProps {
  books: Book[];
  genres: Genre[];
  toReadBooks?: Book[];
  totalBooks?: number;
  totalPages?: number;
}

export default function BookExplorerClient({ books, genres, toReadBooks = [], totalPages = 1 }: BookExplorerClientProps) {
  // État pour stocker tous les livres chargés
  const [allBooks, setAllBooks] = useState<Book[]>(books);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);
  const [readingList, setReadingList] = useState<Book[]>(toReadBooks);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showToReadOnly, setShowToReadOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'netflix' | 'collections' | 'standard'>('netflix');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(totalPages > 1);

  // Pagination pour les livres filtrés (mode standard)
  const {
    currentItems: paginatedBooks,
    pagination,
    goToPage
  } = usePagination({
    items: filteredBooks,
    itemsPerPage: 24, // 6 colonnes x 4 rangées
    initialPage: 1
  });

  // Pagination pour les livres à lire
  const {
    currentItems: paginatedToReadBooks
  } = usePagination({
    items: readingList,
    itemsPerPage: 12, // 6 colonnes x 2 rangées
    initialPage: 1
  });

  // Fonction pour charger plus de livres (pagination côté client)
  const loadMoreBooks = async () => {
    if (isLoading || !hasMorePages) return;
    
    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/books/page/${nextPage}`);
      const data = await response.json();
      
      if (data.books && data.books.length > 0) {
        // Ajouter les nouveaux livres à notre état
        setAllBooks(prev => [...prev, ...data.books]);
        setCurrentPage(nextPage);
        setHasMorePages(nextPage < data.totalPages);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livres supplémentaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour charger les livres d&apos;un genre spécifique
  const loadGenreBooks = useCallback(async (genreId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/books/genre/${genreId}`);
      const data = await response.json();
      
      if (data.books) {
        setAllBooks(data.books);
        setHasMorePages(false); // Tous les livres du genre sont chargés d&apos;un coup
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des livres du genre ${genreId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, setAllBooks, setHasMorePages, setIsLoading]);

  // Effet pour filtrer et trier les livres
  useEffect(() => {
    let result = allBooks;
    // Appliquer les filtres
    result = filterBooks(allBooks, searchQuery, selectedGenre, showToReadOnly);
    // Appliquer le tri
    result = sortBooks(result, sortBy);
    setFilteredBooks(result);
  }, [allBooks, searchQuery, selectedGenre, sortBy, showToReadOnly]);
  
  // Effet pour charger les livres d&apos;un genre lorsqu&apos;il est sélectionné
  useEffect(() => {
    if (selectedGenre) {
      loadGenreBooks(selectedGenre);
    }
  }, [selectedGenre, loadGenreBooks]);
  
  // Initialiser la liste des livres à lire
  useEffect(() => {
    setReadingList(toReadBooks);
  }, [toReadBooks]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-bold mb-4">Genres</h2>
          <div className="flex flex-wrap gap-2">
            <button
              key="all-genres"
              className={`px-3 py-1 rounded-full ${!selectedGenre ? 'bg-red-600 text-black font-medium' : 'bg-red-200 text-black'}`}
              onClick={() => setSelectedGenre('')}
            >
              Tous
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                className={`px-3 py-1 rounded-full ${selectedGenre === genre.id ? 'bg-red-600 text-black font-medium' : 'bg-red-200 text-black'}`}
                onClick={() => setSelectedGenre(genre.id)}
              >
                {genre.name} ({genre.count})
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Rechercher un livre..."
                className="w-full px-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="mr-2">Trier par:</label>
                <select
                  className="px-3 py-2 border rounded-lg"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                >
                  <option value="title">Titre</option>
                  <option value="author">Auteur</option>
                  <option value="genre">Genre</option>
                  <option value="date">Date d&apos;ajout</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="toReadOnly"
                  className="mr-2"
                  checked={showToReadOnly}
                  onChange={e => setShowToReadOnly(e.target.checked)}
                />
                <label htmlFor="toReadOnly">À lire uniquement</label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              key="netflix-mode"
              className={`px-3 py-1 rounded-lg ${viewMode === 'netflix' ? 'bg-red-600 text-black font-medium' : 'bg-red-200 text-black'}`}
              onClick={() => setViewMode('netflix')}
            >
              Netflix
            </button>
            <button
              key="collections-mode"
              className={`px-3 py-1 rounded-lg ${viewMode === 'collections' ? 'bg-red-600 text-black font-medium' : 'bg-red-200 text-black'}`}
              onClick={() => setViewMode('collections')}
            >
              Collections
            </button>
            <button
              key="standard-mode"
              className={`px-3 py-1 rounded-lg ${viewMode === 'standard' ? 'bg-red-600 text-black font-medium' : 'bg-red-200 text-black'}`}
              onClick={() => setViewMode('standard')}
            >
              Standard
            </button>
          </div>
        </div>
      </div>

      {/* Affichage des livres à lire */}
      {readingList.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">À lire</h2>
          <BookGrid books={paginatedToReadBooks} />
        </div>
      )}

      {/* Affichage principal des livres */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {selectedGenre ? `Genre: ${genres.find(g => g.id === selectedGenre)?.name || ''}` : 'Tous les livres'}
          <span className="text-gray-500 ml-2">({filteredBooks.length})</span>
        </h2>

        {viewMode === 'netflix' && (
          <NetflixLayout books={filteredBooks} genres={genres} />
        )}

        {viewMode === 'collections' && (
          <CollectionsView books={filteredBooks} />
        )}

        {viewMode === 'standard' && (
          <>
            <BookGrid books={paginatedBooks} />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          </>
        )}
        
        {/* Bouton pour charger plus de livres */}
        {!selectedGenre && hasMorePages && (
          <div className="flex justify-center mt-8">
            <button 
              onClick={loadMoreBooks}
              disabled={isLoading}
              className="px-6 py-3 bg-red-600 text-black rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </>
              ) : (
                'Charger plus de livres'
              )}
            </button>
          </div>
        )}
        
        {/* Indicateur de chargement pour les changements de genre */}
        {isLoading && selectedGenre && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Chargement des livres...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

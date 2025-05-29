'use client';

import { useState } from 'react';
import { Book } from '@/types';
import { Collection, groupBooksBySeries, groupBooksByAuthor, groupBooksByGenre, getUncategorizedBooks } from '@/lib/collections';
import CollectionCarousel from './CollectionCarousel';
import BookGrid from '../books/BookGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface CollectionsViewProps {
  books: Book[];
}

export default function CollectionsView({ books }: CollectionsViewProps) {
  const [excludeSeriesBooks, setExcludeSeriesBooks] = useState(true);
  
  // Regrouper les livres par série
  const seriesCollections = groupBooksBySeries(books);
  
  // Regrouper les livres par auteur (en excluant éventuellement les livres déjà dans une série)
  const authorCollections = groupBooksByAuthor(books, excludeSeriesBooks);
  
  // Regrouper les livres par genre (en excluant éventuellement les livres déjà dans une série)
  const genreCollections = groupBooksByGenre(books, excludeSeriesBooks);
  
  // Récupérer les livres qui ne sont pas dans une collection
  const allCollections = [...seriesCollections, ...authorCollections, ...genreCollections];
  const uncategorizedBooks = getUncategorizedBooks(books, allCollections);

  // Animation pour les transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all">Toutes les collections</TabsTrigger>
            <TabsTrigger value="series">Séries</TabsTrigger>
            <TabsTrigger value="authors">Auteurs</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center">
            <label htmlFor="excludeSeriesBooks" className="text-sm mr-2">
              Ne pas répéter les livres de série
            </label>
            <input
              type="checkbox"
              id="excludeSeriesBooks"
              checked={excludeSeriesBooks}
              onChange={(e) => setExcludeSeriesBooks(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </div>

        <TabsContent value="all">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Section Séries */}
            {seriesCollections.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold mb-4">Séries</h2>
                <div className="space-y-8">
                  {seriesCollections.map((collection) => (
                    <CollectionCarousel
                      key={collection.id}
                      title={collection.name}
                      books={collection.books}
                      type="series"
                      showNumber={true}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Section Auteurs */}
            {authorCollections.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold mb-4 mt-12">Auteurs</h2>
                <div className="space-y-8">
                  {authorCollections.map((collection) => (
                    <CollectionCarousel
                      key={collection.id}
                      title={collection.name}
                      books={collection.books}
                      type="author"
                    />
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Section Genres */}
            {genreCollections.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold mb-4 mt-12">Genres</h2>
                <div className="space-y-8">
                  {genreCollections.map((collection) => (
                    <CollectionCarousel
                      key={collection.id}
                      title={collection.name}
                      books={collection.books}
                      type="genre"
                    />
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Section Autres livres */}
            {uncategorizedBooks.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold mb-4 mt-12">Autres livres</h2>
                <BookGrid books={uncategorizedBooks} title="" />
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="series">
          <div className="space-y-8">
            {seriesCollections.length > 0 ? (
              seriesCollections.map((collection) => (
                <CollectionCarousel
                  key={collection.id}
                  title={collection.name}
                  books={collection.books}
                  type="series"
                  showNumber={true}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Aucune série trouvée dans votre bibliothèque.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="authors">
          <div className="space-y-8">
            {authorCollections.length > 0 ? (
              authorCollections.map((collection) => (
                <CollectionCarousel
                  key={collection.id}
                  title={collection.name}
                  books={collection.books}
                  type="author"
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Aucun auteur avec plusieurs livres trouvé dans votre bibliothèque.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="genres">
          <div className="space-y-8">
            {genreCollections.length > 0 ? (
              genreCollections.map((collection) => (
                <CollectionCarousel
                  key={collection.id}
                  title={collection.name}
                  books={collection.books}
                  type="genre"
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Aucun genre avec plusieurs livres trouvé dans votre bibliothèque.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

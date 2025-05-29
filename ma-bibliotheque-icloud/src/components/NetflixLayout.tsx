'use client';

import { useState, useEffect } from 'react';
import { Book, Genre } from '@/types';
import FeaturedBook from './hero/FeaturedBook';
import ResponsiveCarousel from './carousel/ResponsiveCarousel';
import { motion } from 'framer-motion';
import { groupBooksBySeries } from '@/lib/collections';

interface NetflixLayoutProps {
  books: Book[];
  genres?: Genre[];
}

// Nouvelles fonctions pour regrouper les livres
function groupBooksByAuthor(books: Book[]): { [author: string]: Book[] } {
  const authorGroups: { [author: string]: Book[] } = {};
  
  books.forEach(book => {
    if (book.author && book.author !== 'Auteur inconnu') {
      if (!authorGroups[book.author]) {
        authorGroups[book.author] = [];
      }
      authorGroups[book.author].push(book);
    }
  });
  
  // Filtrer pour garder uniquement les auteurs avec au moins 2 livres
  return Object.fromEntries(
    Object.entries(authorGroups)
      .filter(([, books]) => books.length >= 2)
      .sort(([, booksA], [, booksB]) => booksB.length - booksA.length)
  );
}

function groupBooksByGenre(books: Book[]): { [genre: string]: Book[] } {
  const genreGroups: { [genre: string]: Book[] } = {};
  
  books.forEach(book => {
    if (book.genre && book.genre !== 'Non classé') {
      if (!genreGroups[book.genre]) {
        genreGroups[book.genre] = [];
      }
      genreGroups[book.genre].push(book);
    }
  });
  
  // Filtrer pour garder uniquement les genres avec au moins 3 livres
  return Object.fromEntries(
    Object.entries(genreGroups)
      .filter(([, books]) => books.length >= 3)
      .sort(([, booksA], [, booksB]) => booksB.length - booksA.length)
  );
}

function getRecentlyAddedBooks(books: Book[], count: number = 10): Book[] {
  return [...books]
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
    .slice(0, count);
}

function getRandomFeaturedBook(books: Book[]): Book | null {
  if (books.length === 0) return null;
  
  // Priorité aux livres avec couverture et résumé
  const goodCandidates = books.filter(book => 
    book.cover && book.summary && book.summary.length > 50
  );
  
  if (goodCandidates.length > 0) {
    return goodCandidates[Math.floor(Math.random() * goodCandidates.length)];
  }
  
  return books[Math.floor(Math.random() * books.length)];
}

export default function NetflixLayout({ books }: NetflixLayoutProps) {
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  // isLoading est utilisé dans le composant FeaturedBook
  const isLoading = false;
  
  useEffect(() => {
    // Sélectionner un livre en vedette
    setFeaturedBook(getRandomFeaturedBook(books));
  }, [books]);
  
  // Regrouper les livres par différentes catégories
  const toReadBooks = books.filter(book => book.toRead);
  const recentlyAddedBooks = getRecentlyAddedBooks(books, 15);
  
  // Obtenir les séries
  const seriesGroups = groupBooksBySeries(books);
  const validSeriesGroups = seriesGroups
    .filter(group => group.books.length >= 2)
    .sort((a, b) => b.books.length - a.books.length);
  
  // Obtenir les auteurs
  const authorGroups = groupBooksByAuthor(books);
  
  // Obtenir les genres
  const genreGroups = groupBooksByGenre(books);
  
  // Animation pour les sections
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Section Hero avec livre en vedette */}
      <FeaturedBook book={featuredBook} isLoading={isLoading} />
      
      {/* Sections de carrousels */}
      <motion.div
        className="mt-4 md:mt-8 space-y-2 md:space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Livres à lire */}
        {toReadBooks.length > 0 && (
          <motion.div variants={itemVariants}>
            <ResponsiveCarousel 
              title="À lire" 
              books={toReadBooks} 
              type="toread" 
            />
          </motion.div>
        )}
        
        {/* Ajouts récents */}
        {recentlyAddedBooks.length > 0 && (
          <motion.div variants={itemVariants}>
            <ResponsiveCarousel 
              title="Ajouts récents" 
              books={recentlyAddedBooks} 
              type="recent" 
            />
          </motion.div>
        )}
        
        {/* Séries */}
        {validSeriesGroups.map(series => (
          <motion.div key={series.name} variants={itemVariants}>
            <ResponsiveCarousel 
              title={series.name} 
              books={series.books} 
              type="series" 
              showNumber={true}
            />
          </motion.div>
        ))}
        
        {/* Auteurs */}
        {Object.entries(authorGroups).map(([author, authorBooks]) => (
          <motion.div key={author} variants={itemVariants}>
            <ResponsiveCarousel 
              title={author} 
              books={authorBooks} 
              type="author" 
            />
          </motion.div>
        ))}
        
        {/* Genres */}
        {Object.entries(genreGroups).map(([genre, genreBooks]) => (
          <motion.div key={genre} variants={itemVariants}>
            <ResponsiveCarousel 
              title={genre} 
              books={genreBooks} 
              type="genre" 
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

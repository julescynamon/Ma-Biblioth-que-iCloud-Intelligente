'use client';

import { useState, useRef, useEffect } from 'react';
import { Book } from '@/types';
import BookCard from '../books/BookCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectionCarouselProps {
  title: string;
  books: Book[];
  type: 'series' | 'author' | 'genre';
  showNumber?: boolean;
}

export default function CollectionCarousel({ 
  title, 
  books, 
  type, 
  showNumber = false 
}: CollectionCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  // Vérifier si le défilement est possible
  useEffect(() => {
    const checkScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [books]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const newPosition = Math.max(0, scrollPosition - carouselRef.current.offsetWidth / 2);
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + carouselRef.current.offsetWidth / 2);
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Styles spécifiques selon le type de collection
  const getBadgeStyle = () => {
    switch (type) {
      case 'series':
        return 'bg-primary text-primary-foreground';
      case 'author':
        return 'bg-blue-500 text-white';
      case 'genre':
        return 'bg-emerald-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div 
      className="py-6 relative" 
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="ml-2 text-sm text-muted-foreground">
            ({books.length} livre{books.length > 1 ? 's' : ''})
          </span>
        </div>
        
        <AnimatePresence>
          {(showControls || canScrollLeft || canScrollRight) && (
            <motion.div 
              className="flex space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Défiler à gauche"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Défiler à droite"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex space-x-4">
          {books.map((book) => (
            <div key={book.id} className="snap-start flex-shrink-0 w-[180px]">
              <div className="relative">
                {showNumber && book.serie?.number && (
                  <div className={`absolute top-0 right-0 z-10 ${getBadgeStyle()} text-xs px-2 py-1 rounded-bl-md rounded-tr-md`}>
                    {book.serie.number}
                  </div>
                )}
                <BookCard book={book} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

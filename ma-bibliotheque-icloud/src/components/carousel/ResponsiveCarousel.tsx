'use client';

import { useState, useRef, useEffect } from 'react';
import { Book } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookCover from './BookCover';

interface ResponsiveCarouselProps {
  title: string;
  books: Book[];
  type?: 'series' | 'author' | 'genre' | 'recent' | 'toread';
  showNumber?: boolean;
}

export default function ResponsiveCarousel({ 
  title, 
  books, 
  type = 'series',
  showNumber = false 
}: ResponsiveCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  // Détection du mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vérifier si le défilement est possible
  useEffect(() => {
    const checkScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    checkScroll();
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(checkScroll);
    if (carouselRef.current) {
      resizeObserver.observe(carouselRef.current);
    }
    
    return () => {
      if (carouselRef.current) {
        resizeObserver.unobserve(carouselRef.current);
      }
    };
  }, [books]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      // Sur mobile, on défile d'un élément à la fois
      // Sur desktop, on défile de plusieurs éléments
      const scrollAmount = isMobile 
        ? 160 // Largeur approximative d'un élément sur mobile
        : carouselRef.current.offsetWidth * 0.75;
        
      const newPosition = Math.max(0, scrollPosition - scrollAmount);
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = isMobile 
        ? 160 // Largeur approximative d'un élément sur mobile
        : carouselRef.current.offsetWidth * 0.75;
        
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.offsetWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Styles spécifiques selon le type de collection
  const getHeaderStyle = () => {
    switch (type) {
      case 'series':
        return 'text-primary';
      case 'author':
        return 'text-blue-500';
      case 'genre':
        return 'text-emerald-500';
      case 'recent':
        return 'text-amber-500';
      case 'toread':
        return 'text-rose-500';
      default:
        return 'text-primary';
    }
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <div 
      className="py-4 md:py-6 relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Titre de la section */}
      <div className="flex justify-between items-center mb-3 px-4 md:px-6">
        <h2 className={`text-lg md:text-2xl font-bold ${getHeaderStyle()}`}>
          {title}
          <span className="ml-2 text-xs md:text-sm text-muted-foreground font-normal">
            ({books.length})
          </span>
        </h2>
        
        {/* Boutons de navigation (visibles sur hover ou si nécessaire) */}
        <AnimatePresence>
          {(showControls || canScrollLeft || canScrollRight) && !isMobile && (
            <motion.div 
              className="flex space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className="p-1 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Défiler à gauche"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className="p-1 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Défiler à droite"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicateurs de défilement (uniquement sur mobile) */}
      {isMobile && (
        <div className="flex justify-center space-x-1 mb-2">
          <div className={`h-1 w-12 rounded-full transition-colors ${canScrollLeft ? 'bg-primary/70' : 'bg-muted'}`}></div>
          <div className={`h-1 w-12 rounded-full transition-colors ${canScrollRight ? 'bg-primary/70' : 'bg-muted'}`}></div>
        </div>
      )}

      {/* Conteneur du carrousel */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-4 md:px-6"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex space-x-3 md:space-x-4">
          {books.map((book) => (
            <div 
              key={book.id} 
              className="snap-start flex-shrink-0 w-[140px] md:w-[180px] transition-transform duration-300 hover:scale-105"
            >
              <BookCover 
                book={book} 
                showNumber={showNumber && type === 'series'} 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Boutons de navigation flottants sur mobile (uniquement visibles pendant le défilement) */}
      {isMobile && (
        <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-2">
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center pointer-events-auto"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center pointer-events-auto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

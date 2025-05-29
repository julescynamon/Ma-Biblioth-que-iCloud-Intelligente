'use client';

import { useState, useRef } from 'react';
import { Book } from '@/types';
import BookCard from './BookCard';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SeriesCarouselProps {
  seriesName: string;
  books: Book[];
}

export default function SeriesCarousel({ seriesName, books }: SeriesCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Trier les livres par numéro dans la série
  const sortedBooks = [...books].sort((a, b) => {
    const aNumber = a.serie?.number || 0;
    const bNumber = b.serie?.number || 0;
    return aNumber - bNumber;
  });

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
      setScrollPosition(carouselRef.current.scrollLeft);
    }
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{seriesName}</h2>
        <div className="flex space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Défiler à gauche"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Défiler à droite"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex space-x-4">
          {sortedBooks.map((book) => (
            <div key={book.id} className="snap-start flex-shrink-0 w-[180px]">
              <div className="relative">
                <div className="absolute top-0 right-0 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                  {book.serie?.number || '?'}
                </div>
                <BookCard book={book} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

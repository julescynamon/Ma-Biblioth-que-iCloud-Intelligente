'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/types';
import { motion } from 'framer-motion';
import { useLazyLoading } from '@/hooks/useLazyLoading';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  // Utiliser le hook de lazy loading
  const { elementRef, isVisible } = useLazyLoading();
  
  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Link href={`/books/${book.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-md transition-all duration-300 group-hover:shadow-xl">
          {book.toRead && (
            <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              À lire
            </div>
          )}
          
          {isVisible ? (
            <Image
              src={book.cover.startsWith('/') ? book.cover : `/data/covers/${book.cover}`}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold line-clamp-2">{book.title}</h3>
              <p className="text-white/80 text-sm mt-1">{book.author}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

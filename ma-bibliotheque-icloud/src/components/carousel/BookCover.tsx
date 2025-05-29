'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Book } from '@/types';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface BookCoverProps {
  book: Book;
  showNumber?: boolean;
}

export default function BookCover({ book, showNumber = false }: BookCoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Obtenir le style du badge selon le type de livre
  const getBadgeStyle = () => {
    if (book.toRead) {
      return 'bg-rose-500 text-white';
    }
    if (book.serie) {
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <motion.div
      className="relative group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {/* Badge de numéro de série */}
      {showNumber && book.serie?.number && (
        <div className={`absolute top-0 right-0 z-10 ${getBadgeStyle()} text-xs px-2 py-1 rounded-bl-md rounded-tr-md`}>
          {book.serie.number}
        </div>
      )}
      
      {/* Badge "À lire" */}
      {book.toRead && !showNumber && (
        <div className="absolute top-0 right-0 z-10 bg-rose-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
          À lire
        </div>
      )}
      
      {/* Couverture du livre */}
      <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3] bg-muted">
        <Image
          src={book.cover || '/placeholder.jpg'}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay avec informations au survol */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        >
          <h3 className="text-white text-sm font-medium line-clamp-2">{book.title}</h3>
          <p className="text-white/80 text-xs mt-1">{book.author}</p>
          
          {/* Bouton d'info */}
          <button className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Info className="h-3.5 w-3.5 text-white" />
          </button>
        </motion.div>
      </div>
      
      {/* Titre et auteur (visible uniquement sur mobile) */}
      <div className="md:hidden mt-2">
        <h3 className="text-sm font-medium line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
      </div>
    </motion.div>
  );
}

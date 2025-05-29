'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Book } from '@/types';
import { motion } from 'framer-motion';
import { Download, BookOpen, Info } from 'lucide-react';
import { truncateText } from '@/lib/utils';

interface FeaturedBookProps {
  book: Book | null;
  isLoading: boolean;
}

export default function FeaturedBook({ book, isLoading }: FeaturedBookProps) {
  const [dominantColor, setDominantColor] = useState('rgba(0, 0, 0, 0.7)');
  
  // Extraire la couleur dominante de la couverture pour créer un dégradé harmonieux
  useEffect(() => {
    if (book?.cover) {
      // Dans une implémentation réelle, on utiliserait une bibliothèque comme color-thief
      // Ici, on simule avec des couleurs prédéfinies basées sur le genre
      const genreColors: Record<string, string> = {
        'Fantasy': 'rgba(70, 40, 120, 0.8)',
        'Science-Fiction': 'rgba(20, 60, 120, 0.8)',
        'Policier': 'rgba(120, 20, 20, 0.8)',
        'Thriller': 'rgba(50, 20, 20, 0.8)',
        'Romance': 'rgba(120, 50, 90, 0.8)',
        'Historique': 'rgba(100, 80, 40, 0.8)',
        'Biographie': 'rgba(60, 90, 60, 0.8)',
      };
      
      setDominantColor(genreColors[book.genre] || 'rgba(40, 40, 40, 0.8)');
    }
  }, [book]);

  if (isLoading || !book) {
    return (
      <div className="w-full h-[50vh] md:h-[60vh] animate-pulse bg-gradient-to-b from-gray-800 to-background rounded-b-lg"></div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
      {/* Fond avec effet de parallaxe et dégradé basé sur la couleur dominante */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${book.cover})`,
          filter: 'blur(30px)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Dégradé par-dessus l'image de fond */}
      <div 
        className="absolute inset-0 bg-gradient-to-t"
        style={{ 
          background: `linear-gradient(to top, 
            var(--background) 0%, 
            ${dominantColor} 50%, 
            rgba(0, 0, 0, 0.7) 100%)` 
        }}
      />
      
      {/* Contenu principal */}
      <div className="relative h-full container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-end md:justify-between">
        {/* Couverture du livre (plus grande sur mobile, à gauche sur desktop) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-48 md:w-64 flex-shrink-0 mb-6 md:mb-0 md:mr-8 rounded-lg overflow-hidden shadow-2xl"
        >
          <Image
            src={book.cover || '/placeholder.jpg'}
            alt={book.title}
            width={256}
            height={384}
            sizes="(max-width: 768px) 192px, 256px"
            className="w-full h-full object-cover"
            priority
          />
        </motion.div>
        
        {/* Informations du livre (en bas sur mobile, à droite sur desktop) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col text-white max-w-lg"
        >
          {/* Badge série si applicable */}
          {book.serie && (
            <div className="mb-2 inline-flex self-start bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              {book.serie.name} • Tome {book.serie.number}
            </div>
          )}
          
          {/* Titre et auteur */}
          <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white">{book.title}</h1>
          <h2 className="text-lg md:text-xl text-white/80 mb-4">{book.author}</h2>
          
          {/* Genre et date */}
          <div className="flex flex-wrap gap-2 mb-3 text-sm text-white/70">
            <span className="bg-white/20 px-2 py-1 rounded">{book.genre}</span>
            {book.publishedDate && (
              <span className="bg-white/20 px-2 py-1 rounded">{book.publishedDate}</span>
            )}
            <span className="bg-white/20 px-2 py-1 rounded">{book.fileType.toUpperCase()}</span>
          </div>
          
          {/* Résumé (limité en hauteur) */}
          <p className="text-white/90 mb-6 line-clamp-3 md:line-clamp-4">
            {book.summary || "Aucun résumé disponible pour ce livre."}
          </p>
          
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 mt-auto">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
              <BookOpen size={18} />
              <span>Lire</span>
            </button>
            <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
              <Download size={18} />
              <span>Télécharger</span>
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-3 rounded-lg flex items-center transition-colors">
              <Info size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

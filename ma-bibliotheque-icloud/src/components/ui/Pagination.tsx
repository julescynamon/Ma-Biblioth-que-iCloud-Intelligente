'use client';

import { PaginationOptions } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  pagination?: PaginationOptions;
  currentPage?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, currentPage: propCurrentPage, totalPages: propTotalPages, onPageChange }: PaginationProps) {
  // Utiliser les propriétés directes ou celles de l'objet pagination
  const currentPage = propCurrentPage ?? pagination?.currentPage ?? 1;
  const totalPages = propTotalPages ?? pagination?.totalPages ?? 1;

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Afficher toutes les pages si leur nombre est inférieur à maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Toujours afficher la première page
      pageNumbers.push(1);
      
      // Calculer les pages du milieu
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Ajuster si on est proche du début ou de la fin
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Ajouter un ellipsis si nécessaire avant les pages du milieu
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Ajouter les pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Ajouter un ellipsis si nécessaire après les pages du milieu
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Toujours afficher la dernière page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <div className="flex space-x-1">
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-3 py-1">
              {page}
            </span>
          )
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

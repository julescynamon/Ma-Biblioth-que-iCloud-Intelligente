import { useState, useEffect, useMemo } from 'react';
import { Book, PaginationOptions } from '@/types';

interface UsePaginationProps {
  items: Book[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationResult {
  currentItems: Book[];
  pagination: PaginationOptions;
  goToPage: (page: number) => void;
  currentPage: number;
}

export function usePagination({ 
  items, 
  itemsPerPage, 
  initialPage = 1 
}: UsePaginationProps): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [visibleItems, setVisibleItems] = useState<Book[]>([]);
  
  // Calculer le nombre total de pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / itemsPerPage)), [items.length, itemsPerPage]);
  
  // S'assurer que la page actuelle est valide
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Calculer les éléments à afficher pour la page actuelle
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [items, currentPage, itemsPerPage]);
  
  // Fonction pour changer de page
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    
    // Faire défiler vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Créer l'objet de pagination
  const pagination: PaginationOptions = {
    currentPage,
    itemsPerPage,
    totalItems: items.length,
    totalPages
  };
  
  return {
    currentItems: visibleItems,
    pagination,
    goToPage,
    currentPage
  };
}

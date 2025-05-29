'use client';

import Image from 'next/image';
import { Book } from '@/types';
import { formatFileSize, getFileIcon } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { FiDownload, FiBook, FiShare2 } from 'react-icons/fi';

interface BookDetailProps {
  book: Book;
}

export default function BookDetail({ book }: BookDetailProps) {
  const handleOpenInBooks = () => {
    // Dans un environnement réel, cette fonction utiliserait l'API de partage
    // ou ouvrirait directement le fichier dans Apple Books
    window.open(`/data/books/${book.filePath}`, '_blank');
  };

  const handleDownload = () => {
    // Créer un lien de téléchargement pour le fichier
    const link = document.createElement('a');
    link.href = `/data/books/${book.filePath}`;
    link.download = book.filePath.split('/').pop() || book.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    // Dans un environnement réel, cette fonction utiliserait l'API de partage Web
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Découvrez "${book.title}" par ${book.author}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Couverture du livre */}
        <div className="md:col-span-1">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
            <Image
              src={book.cover || '/images/placeholder-cover.jpg'}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-6 flex flex-col space-y-3">
            <Button onClick={handleOpenInBooks} className="flex items-center justify-center">
              <FiBook className="mr-2 h-4 w-4" />
              Ouvrir dans Apple Livres
            </Button>
            
            <Button variant="outline" onClick={handleDownload} className="flex items-center justify-center">
              <FiDownload className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
            
            <Button variant="secondary" onClick={handleShare} className="flex items-center justify-center">
              <FiShare2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>

        {/* Détails du livre */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-xl mt-2">{book.author}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Genre</h3>
              <p>{book.genre}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Éditeur</h3>
              <p>{book.publisher || 'Non spécifié'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Date de publication</h3>
              <p>{book.publishedDate || 'Non spécifiée'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Langue</h3>
              <p>{book.language === 'fr' ? 'Français' : book.language || 'Non spécifiée'}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground">Résumé</h3>
            <p className="mt-2 text-base leading-relaxed">
              {book.summary || 'Aucun résumé disponible pour ce livre.'}
            </p>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium">Informations sur le fichier</h3>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p>{getFileIcon(book.fileType)} {book.fileType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taille</p>
                <p>{formatFileSize(book.fileSize)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ajouté le</p>
                <p>{new Date(book.addedDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p>{book.toRead ? 'À lire' : 'Dans la bibliothèque'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

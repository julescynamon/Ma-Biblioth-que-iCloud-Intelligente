'use client';

import { useEffect, useState } from 'react';
import { getBook } from '@/lib/catalogue';
import { Book } from '@/types';
import BookDetail from '@/components/books/BookDetail';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

interface BookPageProps {
  params: {
    id: string;
  };
}

export default function BookPage({ params }: BookPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoading(true);
        const bookData = await getBook(params.id);
        setBook(bookData);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Livre non trouvé</h1>
        <p className="text-muted-foreground mb-6">Le livre que vous recherchez n&apos;existe pas dans votre bibliothèque.</p>
        <button
          onClick={handleBack}
          className="flex items-center justify-center mx-auto px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <FiArrowLeft className="mr-2" />
          Retour à la bibliothèque
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={handleBack}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <FiArrowLeft className="mr-1" />
          Retour à la bibliothèque
        </button>
      </div>
      <BookDetail book={book} />
    </>
  );
}

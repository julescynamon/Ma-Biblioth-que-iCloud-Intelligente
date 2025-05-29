import { Book } from '@/types';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
  title?: string;
}

export default function BookGrid({ books, title }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Aucun livre trouvé</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {title && (
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { getToReadBooks } from '@/lib/catalogue.server';

export async function GET() {
  try {
    const toReadBooks = await getToReadBooks();
    
    return NextResponse.json({ books: toReadBooks });
  } catch (error) {
    console.error('Erreur lors de la récupération des livres à lire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des livres à lire' },
      { status: 500 }
    );
  }
}

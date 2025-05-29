import { NextRequest, NextResponse } from 'next/server';
import { getGenreCatalogue } from '@/lib/catalogue.server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const genreId = params.id;
    
    if (!genreId) {
      return NextResponse.json(
        { error: 'ID du genre manquant' },
        { status: 400 }
      );
    }

    const genreCatalogue = await getGenreCatalogue(genreId);
    
    if (!genreCatalogue) {
      return NextResponse.json(
        { error: 'Genre non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(genreCatalogue);
  } catch (error) {
    console.error(`Erreur lors de la récupération des livres du genre ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des livres' },
      { status: 500 }
    );
  }
}

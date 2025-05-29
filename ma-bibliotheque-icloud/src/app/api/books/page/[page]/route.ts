import { NextRequest, NextResponse } from 'next/server';
import { getPageCatalogue } from '@/lib/catalogue.server';

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const page = parseInt(params.page, 10);
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Numéro de page invalide' },
        { status: 400 }
      );
    }

    const paginatedCatalogue = await getPageCatalogue(page);
    
    return NextResponse.json(paginatedCatalogue);
  } catch (error) {
    console.error('Erreur lors de la récupération de la page du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des livres' },
      { status: 500 }
    );
  }
}

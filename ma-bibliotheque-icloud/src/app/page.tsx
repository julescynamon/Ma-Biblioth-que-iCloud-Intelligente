import {
  getCatalogueIndex,
  getPageCatalogue,
  getToReadBooks,
} from "@/lib/catalogue.server";
import { Genre } from "@/types";
import BookExplorerClient from "@/components/BookExplorerClient";

export default async function Home() {
  try {
    // Charger l'index du catalogue (métadonnées et liste des genres)
    const catalogueIndex = await getCatalogueIndex();

    // Charger seulement la première page de livres pour l'affichage initial
    const firstPage = await getPageCatalogue(1);

    // Charger les livres "à lire" séparément
    const toReadBooks = await getToReadBooks();

    // Convertir les genres de l'index au format attendu par le composant
    const genres: Genre[] = catalogueIndex.genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      count: genre.count,
    }));

    return (
      <BookExplorerClient
        books={firstPage.books}
        genres={genres}
        toReadBooks={toReadBooks}
        totalBooks={catalogueIndex.totalBooks}
        totalPages={firstPage.totalPages}
      />
    );
  } catch (error) {
    console.error("Error loading data:", error);
    // Fallback with empty data
    return (
      <BookExplorerClient
        books={[]}
        genres={[]}
        toReadBooks={[]}
        totalBooks={0}
        totalPages={1}
      />
    );
  }
}

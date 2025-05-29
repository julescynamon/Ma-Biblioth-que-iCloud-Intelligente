/**
 * Script pour optimiser les couvertures de livres
 * 
 * Ce script:
 * 1. Lit toutes les images de couverture du dossier public/data/covers
 * 2. Les optimise (redimensionne à max 300x450px et compresse à < 100Ko)
 * 3. Les renomme selon le format auteur-titre.jpg
 * 4. Les déplace dans le dossier public/images/covers
 * 
 * Nécessite: npm install sharp
 */

// Importation des modules nécessaires
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
// Nous utilisons process.cwd() pour obtenir le chemin racine du projet
// ce qui est plus approprié pour accéder aux fichiers dans le projet

// Chemins des dossiers
const SOURCE_DIR = path.join(process.cwd(), 'public', 'data', 'covers');
const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'covers');
const CATALOGUE_FILE = path.join(process.cwd(), 'public', 'data', 'catalogue.json');

// Dimensions maximales
const MAX_WIDTH = 300;
const MAX_HEIGHT = 450;
const MAX_SIZE_KB = 100; // Taille maximale en Ko

// Création du répertoire cible s'il n'existe pas
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`Répertoire créé: ${TARGET_DIR}`);
}

// Lecture du catalogue pour obtenir les métadonnées des livres
console.log('Lecture du catalogue...');
const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_FILE, 'utf8'));
const { books } = catalogue;

// Création d'une map pour retrouver facilement les livres par ID de couverture
const bookMap = new Map();
books.forEach(book => {
  const coverId = book.cover.includes('/') 
    ? path.basename(book.cover) 
    : book.cover;
  
  bookMap.set(coverId, book);
});

// Fonction pour nettoyer une chaîne pour un nom de fichier
function sanitizeForFilename(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fonction pour générer un nouveau nom de fichier basé sur l'auteur et le titre
function generateNewFilename(book) {
  if (!book) return null;
  
  const author = sanitizeForFilename(book.author || 'unknown');
  const title = sanitizeForFilename(book.title || 'unknown');
  
  return `${author}-${title}.jpg`;
}

// Fonction pour optimiser une image
async function optimizeImage(sourcePath, targetPath, book) {
  try {
    // Si le livre n'est pas trouvé, on garde le nom original
    if (!book) {
      console.warn(`Aucun livre trouvé pour la couverture: ${path.basename(sourcePath)}`);
      return null;
    }
    
    // Générer le nouveau nom de fichier
    const newFilename = generateNewFilename(book);
    if (!newFilename) return null;
    
    const outputPath = path.join(TARGET_DIR, newFilename);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log(`Le fichier existe déjà: ${newFilename}`);
      return { original: path.basename(sourcePath), optimized: newFilename };
    }
    
    // Optimiser l'image
    await sharp(sourcePath)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputPath);
    
    // Vérifier la taille du fichier optimisé
    const stats = fs.statSync(outputPath);
    const fileSizeKB = stats.size / 1024;
    
    // Si l'image est encore trop grande, réduire davantage la qualité
    if (fileSizeKB > MAX_SIZE_KB) {
      const quality = Math.floor(70 * (MAX_SIZE_KB / fileSizeKB));
      
      await sharp(sourcePath)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: Math.max(40, quality), progressive: true })
        .toFile(outputPath);
      
      console.log(`Image compressée davantage: ${newFilename} (${Math.max(40, quality)}% qualité)`);
    }
    
    console.log(`Image optimisée: ${newFilename}`);
    return { original: path.basename(sourcePath), optimized: newFilename };
  } catch (error) {
    console.error(`Erreur lors de l'optimisation de ${sourcePath}:`, error);
    return null;
  }
}

// Fonction principale
async function main() {
  console.log('Début de l\'optimisation des couvertures...');
  
  // Lire tous les fichiers du répertoire source
  const files = fs.readdirSync(SOURCE_DIR)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));
  
  console.log(`${files.length} fichiers trouvés à optimiser`);
  
  // Map pour stocker les correspondances entre anciens et nouveaux noms de fichiers
  const fileMapping = {};
  
  // Traiter chaque fichier
  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const book = bookMap.get(file);
    
    const result = await optimizeImage(sourcePath, TARGET_DIR, book);
    if (result) {
      fileMapping[result.original] = result.optimized;
    }
  }
  
  // Écrire le mapping dans un fichier pour référence future
  const mappingFile = path.join(process.cwd(), 'public', 'data', 'cover-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(fileMapping, null, 2));
  console.log(`Mapping des fichiers écrit dans: ${mappingFile}`);
  
  // Mettre à jour le catalogue avec les nouveaux chemins d'images
  const updatedBooks = books.map(book => {
    const coverId = book.cover.includes('/') 
      ? path.basename(book.cover) 
      : book.cover;
    
    if (fileMapping[coverId]) {
      return {
        ...book,
        cover: `/images/covers/${fileMapping[coverId]}`
      };
    }
    
    return book;
  });
  
  // Écrire le catalogue mis à jour
  const updatedCatalogue = {
    ...catalogue,
    books: updatedBooks,
    lastUpdated: new Date().toISOString()
  };
  
  const updatedCatalogueFile = path.join(process.cwd(), 'public', 'data', 'catalogue-updated.json');
  fs.writeFileSync(updatedCatalogueFile, JSON.stringify(updatedCatalogue, null, 2));
  console.log(`Catalogue mis à jour écrit dans: ${updatedCatalogueFile}`);
  
  console.log('Optimisation des couvertures terminée avec succès!');
}

// En ES modules, nous n'avons pas besoin de vérifier si sharp est installé
// puisque l'import échouerait si le module n'était pas disponible
main().catch(console.error);

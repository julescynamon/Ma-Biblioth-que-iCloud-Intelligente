#!/bin/bash

# Script de démarrage pour Ma Bibliothèque iCloud Intelligente
# Ce script permet de démarrer l'application en une seule commande

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Ma Bibliothèque iCloud Intelligente ===${NC}"
echo -e "${BLUE}=== Script de démarrage ===${NC}"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Chemin du répertoire de l'application
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances...${NC}"
    npm install
fi

# Menu d'options
echo "Que souhaitez-vous faire ?"
echo "1. Démarrer l'application"
echo "2. Scanner les fichiers et générer le catalogue"
echo "3. Construire l'application pour la production"
echo "4. Déployer sur Vercel"
echo "5. Quitter"
echo ""
read -p "Votre choix (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}Démarrage de l'application...${NC}"
        npm run dev
        ;;
    2)
        echo -e "${GREEN}Scan des fichiers et génération du catalogue...${NC}"
        echo -e "${YELLOW}Veuillez confirmer les chemins de vos dossiers :${NC}"
        
        # Demander les chemins des dossiers
        read -p "Chemin du dossier Bibliothèque (iCloud): " library_path
        read -p "Chemin du dossier Livres à lire (iCloud): " toread_path
        
        if [ -z "$library_path" ]; then
            library_path="/Users/$(whoami)/Library/Mobile Documents/com~apple~CloudDocs/Bibliothèque"
        fi
        
        if [ -z "$toread_path" ]; then
            toread_path="/Users/$(whoami)/Library/Mobile Documents/com~apple~CloudDocs/Livres à lire"
        fi
        
        echo -e "${YELLOW}Dossier Bibliothèque : ${library_path}${NC}"
        echo -e "${YELLOW}Dossier Livres à lire : ${toread_path}${NC}"
        
        # Exécuter le script de scan avec les chemins spécifiés
        LIBRARY_PATH="$library_path" TO_READ_PATH="$toread_path" node scripts/scan.js
        ;;
    3)
        echo -e "${GREEN}Construction de l'application pour la production...${NC}"
        npm run build
        echo -e "${GREEN}Application construite avec succès !${NC}"
        echo -e "${YELLOW}Pour démarrer l'application en mode production, exécutez :${NC}"
        echo -e "${BLUE}npm run start${NC}"
        ;;
    4)
        echo -e "${GREEN}Déploiement sur Vercel...${NC}"
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
            npm install -g vercel
        fi
        vercel
        ;;
    5)
        echo -e "${GREEN}Au revoir !${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Choix invalide. Veuillez réessayer.${NC}"
        exit 1
        ;;
esac

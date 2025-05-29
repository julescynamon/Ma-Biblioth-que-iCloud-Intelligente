'use client';

import { useState } from 'react';
import { FiRefreshCw, FiFolder, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);

  // Dans une application réelle, ces valeurs seraient chargées depuis le serveur
  const [iCloudPath, setICloudPath] = useState('/Users/username/Library/Mobile Documents/com~apple~CloudDocs/Bibliothèque');
  const [toReadPath, setToReadPath] = useState('/Users/username/Library/Mobile Documents/com~apple~CloudDocs/Livres à lire');

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setScanStatus('scanning');
      setStatusMessage('Scan des dossiers en cours...');
      
      // Simulation d'un scan (dans une application réelle, ceci serait un appel API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatusMessage('Extraction des métadonnées...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStatusMessage('Génération du catalogue.json...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mise à jour de la date du dernier scan
      const now = new Date();
      setLastScanDate(now.toLocaleString('fr-FR'));
      
      setScanStatus('success');
      setStatusMessage('Catalogue généré avec succès !');
    } catch (error) {
      console.error('Erreur lors du scan:', error);
      setScanStatus('error');
      setStatusMessage('Une erreur est survenue lors du scan. Veuillez réessayer.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Administration</h1>
        
        <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration des dossiers</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="icloud-path" className="block text-sm font-medium mb-1">
                Chemin du dossier Bibliothèque (iCloud)
              </label>
              <div className="flex">
                <input
                  id="icloud-path"
                  type="text"
                  value={iCloudPath}
                  onChange={(e) => setICloudPath(e.target.value)}
                  className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isScanning}
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  disabled={isScanning}
                  aria-label="Parcourir"
                >
                  <FiFolder className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label htmlFor="toread-path" className="block text-sm font-medium mb-1">
                Chemin du dossier "Livres à lire"
              </label>
              <div className="flex">
                <input
                  id="toread-path"
                  type="text"
                  value={toReadPath}
                  onChange={(e) => setToReadPath(e.target.value)}
                  className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isScanning}
                />
                <Button
                  variant="outline"
                  className="rounded-l-none"
                  disabled={isScanning}
                  aria-label="Parcourir"
                >
                  <FiFolder className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Génération du catalogue</h2>
          
          {lastScanDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Dernier scan effectué le : {lastScanDate}
            </p>
          )}
          
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center"
            size="lg"
          >
            {isScanning ? (
              <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FiRefreshCw className="mr-2 h-4 w-4" />
            )}
            {isScanning ? 'Scan en cours...' : 'Scanner et générer le catalogue'}
          </Button>
          
          {scanStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-md ${
              scanStatus === 'scanning' ? 'bg-muted' :
              scanStatus === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              <div className="flex items-start">
                {scanStatus === 'scanning' && (
                  <FiRefreshCw className="h-5 w-5 mr-2 animate-spin text-muted-foreground" />
                )}
                {scanStatus === 'success' && (
                  <FiCheck className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                )}
                {scanStatus === 'error' && (
                  <FiAlertTriangle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                )}
                <p className={`text-sm ${
                  scanStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                  scanStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                  'text-muted-foreground'
                }`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">À propos</h2>
          <p className="text-muted-foreground">
            Ma Bibliothèque iCloud Intelligente est une application locale qui vous permet de gérer et d&apos;organiser votre collection de livres numériques stockés sur iCloud.
          </p>
          <p className="text-muted-foreground mt-2">
            Toutes les données sont stockées localement et aucune information n&apos;est envoyée vers des serveurs externes.
          </p>
        </div>
      </div>
    </div>
  );
}

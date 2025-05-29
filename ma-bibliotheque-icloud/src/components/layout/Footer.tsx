import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Ma Bibliothèque iCloud Intelligente - {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Application locale - Aucune donnée n&apos;est envoyée vers un serveur distant
          </p>
        </div>
      </div>
    </footer>
  );
}

'use client';


import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { Genre, SortOption } from '@/types';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@headlessui/react';

interface FilterBarProps {
  genres: Genre[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showToReadOnly: boolean;
  onToReadChange: (toRead: boolean) => void;
}

export default function FilterBar({
  genres,
  selectedGenre,
  onGenreChange,
  sortBy,
  onSortChange,
  showToReadOnly,
  onToReadChange
}: FilterBarProps) {

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'title', label: 'Titre' },
    { value: 'author', label: 'Auteur' },
    { value: 'genre', label: 'Genre' },
    { value: 'date', label: 'Date d\'ajout' }
  ];

  return (
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtres:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Genre Filter */}
            <div className="relative">
              <Listbox value={selectedGenre} onChange={onGenreChange}>
                <Listbox.Button className="flex items-center justify-between w-full min-w-[150px] h-9 px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent">
                  <span className="block truncate">
                    {selectedGenre === '' ? 'Tous les genres' : genres.find(g => g.id === selectedGenre)?.name || 'Tous les genres'}
                  </span>
                  <FiChevronDown className="h-4 w-4 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 shadow-lg border border-gray-200 dark:border-gray-700">
                  <Listbox.Option
                    key="all-genres"
                    value=""
                    className={({ active }) =>
                      `cursor-pointer select-none relative py-2 px-3 ${
                        active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`
                    }
                  >
                    Tous les genres
                  </Listbox.Option>
                  {genres.map((genre) => (
                    <Listbox.Option
                      key={genre.id}
                      value={genre.id}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 px-3 ${
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between">
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {genre.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {genre.count}
                          </span>
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>

            {/* Sort Options */}
            <div className="relative">
              <Listbox value={sortBy} onChange={onSortChange}>
                <Listbox.Button className="flex items-center justify-between w-full min-w-[150px] h-9 px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent">
                  <span className="block truncate">
                    Trier par: {sortOptions.find(o => o.value === sortBy)?.label}
                  </span>
                  <FiChevronDown className="h-4 w-4 ml-2" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 shadow-lg border border-gray-200 dark:border-gray-700">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 px-3 ${
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>

            {/* À lire toggle */}
            <Button
              variant={showToReadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onToReadChange(!showToReadOnly)}
              className="whitespace-nowrap"
            >
              À lire {showToReadOnly ? '✓' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

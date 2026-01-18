import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  matchPercentage?: number;
  cuisine: string;
  distance: string;
  tags: string[];
  status: 'to_try' | 'validated';
}

interface FavoritesContextType {
  favorites: Restaurant[];
  toggleFavorite: (restaurant: Restaurant) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);

  const toggleFavorite = (restaurant: Restaurant) => {
    setFavorites(prev => {
      const exists = prev.find(r => r.id === restaurant.id);
      if (exists) {
        // Remove from favorites
        console.log(`🗑️ Removing ${restaurant.name} from favorites`);
        return prev.filter(r => r.id !== restaurant.id);
      } else {
        // Add to favorites
        console.log(`❤️ Adding ${restaurant.name} to favorites`);
        return [...prev, restaurant];
      }
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some(r => r.id === id);
  };

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

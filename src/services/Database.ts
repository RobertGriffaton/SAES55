import { UserPreferences } from '../models/PreferencesModel';

// Ce fichier sert uniquement à satisfaire TypeScript.
// À l'exécution, React Native utilisera Database.native.ts ou Database.web.ts

export const initDatabase = async () => {
  console.warn("Fallback Database utilisé (Erreur de configuration si visible en prod)");
  return Promise.resolve();
};

export const searchRestaurants = async (prefs: UserPreferences): Promise<any[]> => {
  return Promise.resolve([]);
};

// Ajoutez ici les autres fonctions si vous en avez (ex: getDB)
export const getDB = () => {
  return null;
};
export const getAllRestaurants = async (): Promise<any[]> => {
  return Promise.resolve([]);
};
export const getRestaurantsNearby = async (lat: number, lon: number, radiusKm?: number): Promise<any[]> => {
  return Promise.resolve([]);
};
export const createUser = async (username: string, avatar?: string): Promise<number | null> => {
  return Promise.resolve(null);
};

export const updateUserName = async (id: number, username: string): Promise<boolean> => {
  return Promise.resolve(false);
};

export const updateUserAvatar = async (id: number, avatar: string): Promise<boolean> => {
  return Promise.resolve(false);
};

export const getUser = async (id: number): Promise<any> => {
  return Promise.resolve(null);
};

export const getAllUsers = async (): Promise<any[]> => {
  return Promise.resolve([]);
};

export const deleteUser = async (id: number): Promise<boolean> => {
  return Promise.resolve(false);
};


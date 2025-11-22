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
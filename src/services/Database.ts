import { UserPreferences } from '../models/PreferencesModel';

// Ce fichier sert uniquement d'interface pour TypeScript.
// À l'exécution, React Native choisira automatiquement :
// - Database.native.ts (sur le téléphone)
// - Database.web.ts (sur le navigateur)

// Définition des types d'actions possibles pour l'algo
export type InteractionAction = 'click' | 'call' | 'route' | 'view' | 'website';

// 1. Initialisation
export const initDatabase = async (): Promise<void> => {
  console.warn("[Database Stub] initDatabase appelé sur le mauvais fichier.");
  return Promise.resolve();
};

// 2. Recherche filtrée
export const searchRestaurants = async (prefs: UserPreferences): Promise<any[]> => {
  return Promise.resolve([]);
};

// 3. Récupérer TOUS les restaurants
export const getAllRestaurants = async (): Promise<any[]> => {
  return Promise.resolve([]);
};

// 4. Récupérer les restaurants à proximité
export const getRestaurantsNearby = async (lat: number, lon: number, radiusKm: number): Promise<any[]> => {
  return Promise.resolve([]);
};

// 5. Gestion des Utilisateurs
export const createUser = async (username: string, avatar?: string): Promise<number | null> => {
  return Promise.resolve(null);
};

export const getUser = async (id: number): Promise<any> => {
  return Promise.resolve(null);
};

export const getAllUsers = async (): Promise<any[]> => {
  return Promise.resolve([]);
};

// 6. ALGORITHME & INTERACTIONS
export const logInteraction = async (
  restaurantId: number, 
  cuisine: string, 
  action: InteractionAction
): Promise<void> => {
  return Promise.resolve();
};

export const getUserHabits = async (): Promise<Record<string, number>> => {
  return Promise.resolve({});
};

// 7. Utilitaire
export const getDB = () => {
  return null;
};
export const getRestaurantPopularity = async (): Promise<Record<number, number>> => {
  return Promise.resolve({});
};
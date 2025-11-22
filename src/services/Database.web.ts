import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../models/PreferencesModel';

// Clé de stockage uniquement pour les NOUVEAUX restaurants ajoutés par l'utilisateur
const DB_KEY_CUSTOM = 'food_reco_db_custom_v1';
const DB_USERS_KEY = 'food_reco_users_v1';

// 1. Chargement des données STATIQUES en mémoire (RAM)
// On ne les met PAS dans le LocalStorage pour éviter le "QuotaExceededError"
const rawData = require('../data/restaurants.json');

const staticData = (Array.isArray(rawData) ? rawData : (rawData.restaurants || [])).map((r: any) => ({
  ...r,
  // Sécurisation des IDs
  id: r.id || Math.random().toString(36).substr(2, 9),
  // Normalisation
  cuisines: Array.isArray(r.cuisine) ? r.cuisine.join(',') : (r.cuisine || ""),
  vegetarian: r.diet?.vegetarian ? 1 : (r.vegetarian === 'yes' ? 1 : 0),
  vegan: r.diet?.vegan ? 1 : (r.vegan === 'yes' ? 1 : 0),
  takeaway: r.options?.takeaway ? 1 : (r.takeaway === 'yes' ? 1 : 0),
}));

// --- API PUBLIQUE ---

export const initDatabase = async () => {
  // Sur le web, pas besoin d'initialiser grand chose car 'staticData' est déjà en mémoire.
  console.log(`[Web DB] ${staticData.length} restaurants chargés en mémoire (Lecture seule).`);
  try {
    const custom = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    if (custom) console.log("[Web DB] Données utilisateur personnalisées trouvées.");
  } catch (e) {
    console.warn("Erreur lecture stockage local:", e);
  }
};

export const searchRestaurants = async (prefs: UserPreferences) => {
  // 1. Récupérer les ajouts de l'utilisateur (si y en a)
  let customData = [];
  try {
    const json = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    if (json) customData = JSON.parse(json);
  } catch (e) {
    console.error(e);
  }

  // 2. Fusionner : Données du fichier JSON + Données du navigateur
  const allRestaurants = [...staticData, ...customData];

  console.log(`[Recherche Web] Filtrage parmi ${allRestaurants.length} restaurants...`);

  // 3. Filtrer
  const results = allRestaurants.filter((r: any) => {
    // Filtre Cuisines
    if (prefs.cuisines.length > 0) {
      const restoCuisines = (r.cuisines || "").toLowerCase();
      const match = prefs.cuisines.some(pref => restoCuisines.includes(pref.toLowerCase()));
      if (!match) return false;
    }
    // Filtres booléens
    if (prefs.diet === 'Végétarien' && r.vegetarian !== 1) return false;
    if (prefs.diet === 'Végan' && r.vegan !== 1) return false;
    if (prefs.options.emporter && r.takeaway !== 1) return false;

    return true;
  });

  return results;
};

// Fonction pour ajouter un restaurant (Sauvegardé dans le navigateur !)
export const addRestaurant = async (newResto: any) => {
  try {
    const json = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    const currentCustom = json ? JSON.parse(json) : [];
    
    currentCustom.push(newResto);
    
    // On ne sauvegarde QUE les données perso, donc ça ne dépassera pas le quota
    await AsyncStorage.setItem(DB_KEY_CUSTOM, JSON.stringify(currentCustom));
    console.log("[Web DB] Restaurant ajouté et sauvegardé !");
  } catch (e) {
    console.error("Erreur sauvegarde web:", e);
  }
};
export const createUser = async (username: string, avatar: string = "default") => {
  try {
    const json = await AsyncStorage.getItem(DB_USERS_KEY);
    const users = json ? JSON.parse(json) : [];

    const newUser = {
      id: Date.now(), // Faux ID unique basé sur le temps
      username,
      avatar,
      created_at: Date.now()
    };

    users.push(newUser);
    await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    
    console.log("[Web DB] Utilisateur créé :", newUser);
    return newUser.id;
  } catch (e) {
    console.error("Erreur création user web:", e);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    const json = await AsyncStorage.getItem(DB_USERS_KEY);
    const users = json ? JSON.parse(json) : [];
    return users.find((u: any) => u.id === id) || null;
  } catch (e) {
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const json = await AsyncStorage.getItem(DB_USERS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const getAllRestaurants = async () => {
  try {
    const json = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    const customData = json ? JSON.parse(json) : [];
    return [...staticData, ...customData];
  } catch (e) {
    console.error("Erreur recuperation restaurants web:", e);
    return [...staticData];
  }
};

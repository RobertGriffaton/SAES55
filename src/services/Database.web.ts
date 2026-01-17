import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../models/PreferencesModel';

// Clés de stockage
const DB_KEY_CUSTOM = 'food_reco_db_custom_v1';
const DB_USERS_KEY = 'food_reco_users_v1';
const DB_INTERACTIONS_KEY = 'food_reco_interactions_v1'; // Ajout pour sauvegarder les clics

// Chargement du JSON statique en mémoire
const rawData = require('../data/restaurants.json');

// Normalisation des données pour le web
const staticData = (Array.isArray(rawData) ? rawData : (rawData.restaurants || [])).map((r: any) => ({
  ...r,
  id: r.id || Math.random().toString(36).substr(2, 9),
  cuisines: Array.isArray(r.cuisine) ? r.cuisine.join(',') : (r.cuisine || ""),
  // Gestion robuste des coordonnées pour le web aussi
  lat: typeof r.lat === 'number' ? r.lat : (r.meta_geo_point?.lat ?? 0),
  lon: typeof r.lon === 'number' ? r.lon : (r.meta_geo_point?.lon ?? 0),
  vegetarian: r.diet?.vegetarian ? 1 : (r.vegetarian === 'yes' ? 1 : 0),
  vegan: r.diet?.vegan ? 1 : (r.vegan === 'yes' ? 1 : 0),
  takeaway: r.options?.takeaway ? 1 : (r.takeaway === 'yes' ? 1 : 0),
}));

// --- API PUBLIQUE ---

export const initDatabase = async () => {
  console.log(`[Web DB] ${staticData.length} restaurants chargés en mémoire (Lecture seule).`);
  try {
    const custom = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    if (custom) console.log("[Web DB] Données utilisateur personnalisées trouvées.");
  } catch (e) {
    console.warn("Erreur lecture stockage local:", e);
  }
};

export const searchRestaurants = async (prefs: UserPreferences) => {
  let customData: any[] = [];
  try {
    const json = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    if (json) customData = JSON.parse(json);
  } catch (e) {
    console.error(e);
  }

  const allRestaurants = [...staticData, ...customData];

  console.log(`[Recherche Web] Filtrage parmi ${allRestaurants.length} restaurants...`);

  const results = allRestaurants.filter((r: any) => {
    if (prefs.cuisines.length > 0) {
      const restoCuisines = (r.cuisines || "").toLowerCase();
      const match = prefs.cuisines.some(pref => restoCuisines.includes(pref.toLowerCase()));
      if (!match) return false;
    }
    if (prefs.diet === 'Végétarien' && r.vegetarian !== 1) return false;
    if (prefs.diet === 'Végan' && r.vegan !== 1) return false;
    if (prefs.options.emporter && r.takeaway !== 1) return false;
    return true;
  });

  return results;
};

export const addRestaurant = async (newResto: any) => {
  try {
    const json = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    const currentCustom = json ? JSON.parse(json) : [];
    currentCustom.push(newResto);
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
      id: Date.now(),
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

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getRestaurantsNearby = async (lat: number, lon: number, radiusKm: number = 5) => {
  try {
    const all = await getAllRestaurants();
    const withDistance = all
      .filter((r: any) => typeof r.lat === 'number' && typeof r.lon === 'number' && r.lat !== 0 && r.lon !== 0)
      .map((r: any) => ({
        ...r,
        distanceKm: haversineKm(lat, lon, r.lat, r.lon),
      }))
      .filter((r: any) => r.distanceKm <= radiusKm)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
    return withDistance;
  } catch (e) {
    console.error("Erreur recuperation restos proches web:", e);
    return [];
  }
};

// --- INTERACTION & ALGO (Mise à jour V2) ---

export const logInteraction = async (
  restaurantId: number,
  cuisine: string,
  action: 'click' | 'call' | 'route' | 'view' | 'website'
) => {
  try {
    const json = await AsyncStorage.getItem(DB_INTERACTIONS_KEY);
    const history = json ? JSON.parse(json) : [];

    // On ajoute l'interaction
    history.push({
      restaurantId,
      cuisine_tag: cuisine,
      action_type: action,
      timestamp: Date.now()
    });

    await AsyncStorage.setItem(DB_INTERACTIONS_KEY, JSON.stringify(history));
    console.log(`[Web Interaction] Sauvegardée: ${action} sur ${restaurantId}`);
  } catch (e) {
    console.error("Erreur logInteraction web:", e);
  }
};

export const getUserHabits = async (): Promise<Record<string, number>> => {
  try {
    const json = await AsyncStorage.getItem(DB_INTERACTIONS_KEY);
    const history = json ? JSON.parse(json) : [];
    const habits: Record<string, number> = {};

    history.forEach((h: any) => {
      const tags = (h.cuisine_tag || "").split(',');
      tags.forEach((t: string) => {
        const cleanTag = t.trim().toLowerCase();
        if (cleanTag) {
          habits[cleanTag] = (habits[cleanTag] || 0) + 1;
        }
      });
    });

    console.log(`[Web Algo] ${Object.keys(habits).length} habitudes trouvées.`);
    return habits;
  } catch (e) {
    return {};
  }
};

// --- NOUVEAU : Fonction requise pour la "Fidélité" ---
export const getRestaurantPopularity = async (): Promise<Record<number, number>> => {
  try {
    const json = await AsyncStorage.getItem(DB_INTERACTIONS_KEY);
    const history = json ? JSON.parse(json) : [];
    const popularity: Record<number, number> = {};

    history.forEach((h: any) => {
      // On ne compte que les actions engageantes comme sur mobile
      if (['click', 'call', 'route', 'website'].includes(h.action_type)) {
        const id = Number(h.restaurantId);
        if (!isNaN(id)) {
          popularity[id] = (popularity[id] || 0) + 1;
        }
      }
    });

    return popularity;
  } catch (e) {
    return {};
  }
};

// --- FAVORIS (avec userId et validated) ---
const DB_FAVORITES_KEY = 'food_reco_favorites_v2';

interface FavoriteEntry {
  restaurantId: string;
  userId: string;
  validated: boolean;
  createdAt: number;
}

// Récupérer toutes les entrées de favoris
const getAllFavoriteEntries = async (): Promise<FavoriteEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(DB_FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

// Sauvegarder toutes les entrées
const saveFavoriteEntries = async (entries: FavoriteEntry[]): Promise<void> => {
  await AsyncStorage.setItem(DB_FAVORITES_KEY, JSON.stringify(entries));
};

export const addFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    const entries = await getAllFavoriteEntries();
    const key = String(restaurantId);
    const uid = userId || 'default';

    // Vérifier si déjà existant pour cet utilisateur
    const exists = entries.some(e => e.restaurantId === key && e.userId === uid);
    if (!exists) {
      entries.push({
        restaurantId: key,
        userId: uid,
        validated: false,
        createdAt: Date.now()
      });
      await saveFavoriteEntries(entries);
      console.log(`[Web DB] Restaurant ${restaurantId} ajouté aux favoris pour user ${uid}`);
    }
  } catch (e) {
    console.error("Erreur ajout favori:", e);
  }
};

export const removeFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    const entries = await getAllFavoriteEntries();
    const key = String(restaurantId);
    const uid = userId || 'default';

    const filtered = entries.filter(e => !(e.restaurantId === key && e.userId === uid));
    await saveFavoriteEntries(filtered);
    console.log(`[Web DB] Restaurant ${restaurantId} retiré des favoris pour user ${uid}`);
  } catch (e) {
    console.error("Erreur suppression favori:", e);
  }
};

export const validateFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    const entries = await getAllFavoriteEntries();
    const key = String(restaurantId);
    const uid = userId || 'default';

    const entry = entries.find(e => e.restaurantId === key && e.userId === uid);
    if (entry) {
      entry.validated = true;
      await saveFavoriteEntries(entries);
      console.log(`[Web DB] Restaurant ${restaurantId} validé pour user ${uid}`);
    }
  } catch (e) {
    console.error("Erreur validation favori:", e);
  }
};

export const unvalidateFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    const entries = await getAllFavoriteEntries();
    const key = String(restaurantId);
    const uid = userId || 'default';

    const entry = entries.find(e => e.restaurantId === key && e.userId === uid);
    if (entry) {
      entry.validated = false;
      await saveFavoriteEntries(entries);
      console.log(`[Web DB] Restaurant ${restaurantId} remis en "À tester" pour user ${uid}`);
    }
  } catch (e) {
    console.error("Erreur unvalidation favori:", e);
  }
};

export const getFavorites = async (userId?: string, validated?: boolean): Promise<any[]> => {
  try {
    const entries = await getAllFavoriteEntries();
    const uid = userId || 'default';

    // Filtrer par utilisateur et optionnellement par statut validé
    let userEntries = entries.filter(e => e.userId === uid);
    if (validated !== undefined) {
      userEntries = userEntries.filter(e => e.validated === validated);
    }

    if (userEntries.length === 0) return [];

    // Récupérer les objets complets des restaurants
    const allRestaurants = await getAllRestaurants();
    const favorites = allRestaurants.filter((r: any) =>
      userEntries.some(e => e.restaurantId === String(r.id))
    ).map((r: any) => ({
      ...r,
      validated: userEntries.find(e => e.restaurantId === String(r.id))?.validated || false
    }));

    console.log(`[Web DB] ${favorites.length} favoris récupérés pour user ${uid} (validated=${validated})`);
    return favorites;
  } catch (e) {
    console.error("Erreur récupération favoris:", e);
    return [];
  }
};

export const isFavorite = async (restaurantId: number, userId?: string): Promise<boolean> => {
  try {
    const entries = await getAllFavoriteEntries();
    const key = String(restaurantId);
    const uid = userId || 'default';
    return entries.some(e => e.restaurantId === key && e.userId === uid);
  } catch (e) {
    return false;
  }
};
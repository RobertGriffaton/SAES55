import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserPreferences } from "../models/PreferencesModel";

// Cles de stockage pour les donnees personnalisees
const DB_KEY_CUSTOM = "food_reco_db_custom_v1";
const DB_USERS_KEY = "food_reco_users_v1";

// Chargement du JSON statique en memoire
const rawData = require("../data/restaurants.json");

const toBoolFlag = (value: any) => {
  if (typeof value !== "string") return 0;
  const normalized = value.toLowerCase();
  if (
    normalized === "yes" ||
    normalized === "only" ||
    normalized === "limited"
  ) {
    return 1;
  }
  return 0;
};

const takeawayFlag = (value: any) => {
  if (typeof value !== "string") return 0;
  const normalized = value.toLowerCase();
  if (
    normalized === "yes" ||
    normalized === "only" ||
    normalized === "sandwitches"
  ) {
    return 1;
  }
  return 0;
};

const staticData = (Array.isArray(rawData) ? rawData : rawData.restaurants || []).map(
  (r: any) => ({
    ...r,
    id: r.id || Math.random().toString(36).substr(2, 9),
    cuisines: Array.isArray(r.cuisine) ? r.cuisine.join(",") : r.cuisine || "",
    lat: typeof r.lat === "number" ? r.lat : r.meta_geo_point?.lat ?? null,
    lon: typeof r.lon === "number" ? r.lon : r.meta_geo_point?.lon ?? null,
    vegetarian: toBoolFlag(r.vegetarian),
    vegan: toBoolFlag(r.vegan),
    takeaway: takeawayFlag(r.takeaway),
  })
);

// --- API PUBLIQUE ---

export const initDatabase = async () => {
  console.log(
    `[Web DB] ${staticData.length} restaurants charges en memoire (Lecture seule).`
  );
  try {
    const custom = await AsyncStorage.getItem(DB_KEY_CUSTOM);
    if (custom) console.log("[Web DB] Donnees utilisateur personalisees trouvees.");
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

  console.log(
    `[Recherche Web] Filtrage parmi ${allRestaurants.length} restaurants...`
  );

  const results = allRestaurants.filter((r: any) => {
    if (prefs.preferredTypes.length > 0) {
      if (!prefs.preferredTypes.includes(r.type)) return false;
    }
    if (prefs.diet === "vegetarian" && r.vegetarian !== 1) return false;
    if (prefs.diet === "vegan" && r.vegan !== 1) return false;
    if (prefs.takeawayPreferred && r.takeaway !== 1) return false;
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
    console.log("[Web DB] Restaurant ajoute et sauvegarde !");
  } catch (e) {
    console.error("Erreur sauvegarde web:", e);
  }
};

export const createUser = async (
  username: string,
  avatar: string = "default"
) => {
  try {
    const json = await AsyncStorage.getItem(DB_USERS_KEY);
    const users = json ? JSON.parse(json) : [];

    const newUser = {
      id: Date.now(),
      username,
      avatar,
      created_at: Date.now(),
    };

    users.push(newUser);
    await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

    console.log("[Web DB] Utilisateur cree :", newUser);
    return newUser.id;
  } catch (e) {
    console.error("Erreur creation user web:", e);
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

export const getRestaurantsNearby = async (
  lat: number,
  lon: number,
  radiusKm: number = 5
) => {
  try {
    const all = await getAllRestaurants();
    const withDistance = all
      .filter((r: any) => typeof r.lat === "number" && typeof r.lon === "number")
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

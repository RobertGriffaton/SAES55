// src/services/Database.native.ts
import * as SQLite from "expo-sqlite";
import { UserPreferences } from "../models/PreferencesModel";

// Import du JSON via require pour compatibilite
const rawData = require("../data/restaurants.json");
const restaurantsList: any[] = Array.isArray(rawData)
  ? rawData
  : rawData.restaurants || [];

const db = SQLite.openDatabaseSync("food_reco.db");

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

export const initDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT,
        cuisines TEXT,
        lat REAL,
        lon REAL,
        vegetarian INTEGER,
        vegan INTEGER,
        takeaway INTEGER
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        avatar TEXT,
        created_at INTEGER
      );
    `);

    await ensureRestaurantsSeeded();
  } catch (error) {
    console.error("Erreur init BDD Mobile:", error);
  }
};

const insertDataFromJSON = async () => {
  for (const r of restaurantsList) {
    const cuisinesStr = Array.isArray(r.cuisine)
      ? r.cuisine.join(",")
      : r.cuisine || "";
    const lat =
      typeof r.lat === "number" ? r.lat : r.meta_geo_point?.lat ?? null;
    const lon =
      typeof r.lon === "number" ? r.lon : r.meta_geo_point?.lon ?? null;

    await db.runAsync(
      `INSERT INTO restaurants (name, type, cuisines, lat, lon, vegetarian, vegan, takeaway) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.name,
        r.type,
        cuisinesStr,
        lat,
        lon,
        toBoolFlag(r.vegetarian),
        toBoolFlag(r.vegan),
        takeawayFlag(r.takeaway),
      ]
    );
  }
};

const ensureRestaurantsSeeded = async () => {
  try {
    const rowCount: any = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM restaurants"
    );
    const rowWithLat: any = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM restaurants WHERE lat IS NOT NULL AND lon IS NOT NULL"
    );
    const count = rowCount?.count ?? 0;
    const withLat = rowWithLat?.count ?? 0;

    // Si aucune donnee ou si les donnees n'ont pas de coordonnees, on reimporte le JSON
    if (count === 0 || withLat === 0) {
      await db.execAsync("DELETE FROM restaurants;");
      await insertDataFromJSON();
      console.log(
        `[Mobile DB] ${restaurantsList.length} restaurants importes depuis le JSON.`
      );
    }
  } catch (e) {
    console.error("Erreur lors de l'initialisation des restaurants:", e);
  }
};

// Fonction de recherche SQL optimise pour le mobile
export const searchRestaurants = async (prefs: UserPreferences) => {
  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params: any[] = [];

  if (prefs.preferredTypes.length > 0) {
    const placeholders = prefs.preferredTypes.map(() => "?").join(", ");
    query += ` AND type IN (${placeholders})`;
    params.push(...prefs.preferredTypes);
  }

  if (prefs.diet === "vegetarian") query += " AND vegetarian = 1";
  if (prefs.diet === "vegan") query += " AND vegan = 1";

  if (prefs.takeawayPreferred) query += " AND takeaway = 1";

  const results = await db.getAllAsync(query, params);
  return results;
};

export const getAllRestaurants = async () => {
  try {
    return await db.getAllAsync("SELECT * FROM restaurants ORDER BY name ASC");
  } catch (e) {
    console.error("Erreur recuperation restaurants:", e);
    return [];
  }
};

// Calcul de distance simple (Haversine)
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Rayon terrestre en km
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
    const rows = await db.getAllAsync(
      "SELECT * FROM restaurants WHERE lat IS NOT NULL AND lon IS NOT NULL"
    );
    const withDistance = rows
      .map((r: any) => ({
        ...r,
        distanceKm: haversineKm(lat, lon, r.lat, r.lon),
      }))
      .filter((r: any) => r.distanceKm <= radiusKm)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
    return withDistance;
  } catch (e) {
    console.error("Erreur recuperation restaurants proches:", e);
    return [];
  }
};

export const createUser = async (username: string, avatar: string = "default") => {
  try {
    const result = await db.runAsync(
      "INSERT INTO users (username, avatar, created_at) VALUES (?, ?, ?)",
      [username, avatar, Date.now()]
    );
    console.log("[Mobile] Utilisateur cree avec l'ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (e) {
    console.error("Erreur creation user:", e);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    const user = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return user;
  } catch (e) {
    console.error("Erreur recuperation user:", e);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    return await db.getAllAsync("SELECT * FROM users");
  } catch (e) {
    return [];
  }
};

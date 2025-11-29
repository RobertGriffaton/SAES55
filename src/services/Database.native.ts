// src/services/Database.native.ts
import * as SQLite from 'expo-sqlite';
import { UserPreferences } from '../models/PreferencesModel';

// Import du JSON via require pour compatibilité
const rawData = require('../data/restaurants.json');
const restaurantsList: any[] = Array.isArray(rawData) ? rawData : (rawData.restaurants || []);

const db = SQLite.openDatabaseSync('food_reco.db');

export const initDatabase = async () => {
  try {
    // 1. On crée la table RESTAURANTS (code existant...)
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

    // 2. --- NOUVEAU : On crée la table USERS ---
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        avatar TEXT,
        created_at INTEGER
      );
    `);

    // ... le reste de votre code de chargement JSON (count restaurants, etc.)
  } catch (error) {
    console.error("Erreur init BDD Mobile:", error);
  }
};

const insertDataFromJSON = async () => {
  for (const r of restaurantsList) {
    const cuisinesStr = Array.isArray(r.cuisine) ? r.cuisine.join(',') : (r.cuisine || "");
    await db.runAsync(
      `INSERT INTO restaurants (name, type, cuisines, lat, lon, vegetarian, vegan, takeaway) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.name, r.type, cuisinesStr, r.lat, r.lon, r.diet?.vegetarian ? 1 : 0, r.diet?.vegan ? 1 : 0, r.options?.takeaway ? 1 : 0]
    );
  }
};

// Fonction de recherche SQL optimisée pour le mobile
export const searchRestaurants = async (prefs: UserPreferences) => {
  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params: any[] = [];

  // Filtre Cuisines (recherche textuelle simple)
  if (prefs.cuisines.length > 0) {
    const conditions = prefs.cuisines.map(() => "cuisines LIKE ?").join(" OR ");
    query += ` AND (${conditions})`;
    prefs.cuisines.forEach(c => params.push(`%${c}%`));
  }

  // Filtre Diet
  if (prefs.diet === 'Végétarien') query += " AND vegetarian = 1";
  if (prefs.diet === 'Végan') query += " AND vegan = 1";
  
  // Filtre Options
  if (prefs.options.emporter) query += " AND takeaway = 1";

  // Note : Le calcul de distance précis se fait souvent après récupération pour simplifier SQL
  // Ici on renvoie tout ce qui match les critères, on filtrera la distance en JS si besoin
  const results = await db.getAllAsync(query, params);
  return results;
};
export const createUser = async (username: string, avatar: string = "default") => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (username, avatar, created_at) VALUES (?, ?, ?)',
      [username, avatar, Date.now()]
    );
    console.log("[Mobile] Utilisateur créé avec l'ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (e) {
    console.error("Erreur création user:", e);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    const user = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
    return user;
  } catch (e) {
    console.error("Erreur récupération user:", e);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM users');
  } catch (e) {
    return [];
  }
};

// 1. Récupérer tous les restaurants (Attention, ça peut être lourd sur mobile)
export const getAllRestaurants = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM restaurants LIMIT 100'); // LIMIT 100 pour éviter de crash si 30k restos
  } catch (e) {
    console.error("Erreur getAllRestaurants mobile:", e);
    return [];
  }
};

// 2. Récupérer les restaurants proches (Optimisation Bounding Box)
export const getRestaurantsNearby = async (userLat: number, userLon: number, radiusKm: number) => {
  try {
    // Optimisation : On ne charge pas toute la base.
    // On calcule un carré grossier autour de l'utilisateur pour SQL
    // 1 degré de latitude ~= 111 km
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(userLat * (Math.PI / 180)));

    const minLat = userLat - latDelta;
    const maxLat = userLat + latDelta;
    const minLon = userLon - lonDelta;
    const maxLon = userLon + lonDelta;

    // Requête SQL rapide (Bounding Box)
    const candidates = await db.getAllAsync(
      `SELECT * FROM restaurants 
       WHERE lat BETWEEN ? AND ? 
       AND lon BETWEEN ? AND ?`,
      [minLat, maxLat, minLon, maxLon]
    );

    // Filtrage précis (Cercle exact) en JavaScript
    // On réutilise la formule Haversine ici
    const results = candidates.map((r: any) => ({
      ...r,
      distanceKm: getDistanceFromLatLonInKm(userLat, userLon, r.lat, r.lon)
    })).filter((r: any) => r.distanceKm <= radiusKm)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    return results;

  } catch (e) {
    console.error("Erreur getRestaurantsNearby mobile:", e);
    return [];
  }
};

// Fonction utilitaire pour le calcul précis (à mettre en bas du fichier ou importer)
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Rayon de la terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);
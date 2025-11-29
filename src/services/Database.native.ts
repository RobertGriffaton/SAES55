import * as SQLite from 'expo-sqlite';
import { UserPreferences } from '../models/PreferencesModel';

// 1. IMPORT ET PRÉPARATION DES DONNÉES JSON
// On utilise 'require' pour charger le fichier localement
const rawData = require('../data/restaurants.json');

// Sécurisation : on récupère le tableau qu'il soit direct ou dans une clé "restaurants"
const restaurantsList: any[] = Array.isArray(rawData) 
  ? rawData 
  : (rawData.restaurants || []);

// 2. OUVERTURE DE LA BASE DE DONNÉES (Mode Synchrone avec Expo SQLite moderne)
const db = SQLite.openDatabaseSync('food_reco.db');

// --- FONCTIONS D'INITIALISATION ---

export const initDatabase = async () => {
  try {
    // A. Création de la table RESTAURANTS
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

    // B. Création de la table UTILISATEURS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        avatar TEXT,
        created_at INTEGER
      );
    `);

    // C. Vérification et Remplissage
    const result = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM restaurants');
    
    if (result && result.count === 0) {
      console.log(`[Mobile DB] Base vide. Insertion de ${restaurantsList.length} restaurants...`);
      await insertDataFromJSON();
    } else {
      console.log(`[Mobile DB] Base prête (${result?.count} restaurants).`);
    }

  } catch (error) {
    console.error("Erreur initDatabase Mobile:", error);
  }
};

const insertDataFromJSON = async () => {
  try {
    await db.withTransactionAsync(async () => {
        for (const r of restaurantsList) {
            // 1. CORRECTION : On cherche les coordonnées au bon endroit
            let latitude = 0;
            let longitude = 0;

            if (typeof r.lat === 'number') {
                latitude = r.lat;
            } else if (r.meta_geo_point && typeof r.meta_geo_point.lat === 'number') {
                latitude = r.meta_geo_point.lat;
            }

            if (typeof r.lon === 'number') {
                longitude = r.lon;
            } else if (r.meta_geo_point && typeof r.meta_geo_point.lon === 'number') {
                longitude = r.meta_geo_point.lon;
            }

            // Si on a toujours 0, on ignore ce restaurant (il est inutile sans GPS)
            if (latitude === 0 && longitude === 0) continue;

            const cuisinesStr = Array.isArray(r.cuisine) ? r.cuisine.join(',') : (r.cuisine || "");
            const isVeg = (r.diet && r.diet.vegetarian) ? 1 : (r.vegetarian === "yes" ? 1 : 0);
            const isVegan = (r.diet && r.diet.vegan) ? 1 : (r.vegan === "yes" ? 1 : 0);
            const isTakeaway = (r.options && r.options.takeaway) ? 1 : (r.takeaway === "yes" ? 1 : 0);

            await db.runAsync(
            `INSERT INTO restaurants (name, type, cuisines, lat, lon, vegetarian, vegan, takeaway) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                r.name || "Inconnu",
                r.type || "restaurant",
                cuisinesStr,
                latitude,   // On utilise la variable corrigée
                longitude,  // On utilise la variable corrigée
                isVeg,
                isVegan,
                isTakeaway
            ]
            );
        }
    });
    console.log("[Mobile DB] Importation terminée avec succès !");
  } catch (error) {
    console.error("Erreur insertDataFromJSON:", error);
  }
};

// --- FONCTIONS DE RECHERCHE & CARTE ---

export const searchRestaurants = async (prefs: UserPreferences) => {
  let query = "SELECT * FROM restaurants WHERE 1=1";
  const params: any[] = [];

  // Filtre Cuisines
  if (prefs.cuisines.length > 0) {
    const conditions = prefs.cuisines.map(() => "cuisines LIKE ?").join(" OR ");
    query += ` AND (${conditions})`;
    prefs.cuisines.forEach(c => params.push(`%${c}%`));
  }

  // Filtres Régime
  if (prefs.diet === 'Végétarien') query += " AND vegetarian = 1";
  if (prefs.diet === 'Végan') query += " AND vegan = 1";
  
  // Filtre Options
  if (prefs.options.emporter) query += " AND takeaway = 1";

  // Tri par distance (si on avait la position ici) ou par défaut
  query += " LIMIT 50"; // Limite pour la performance

  try {
    return await db.getAllAsync(query, params);
  } catch (e) {
    console.error("Erreur searchRestaurants:", e);
    return [];
  }
};

// C'est la fonction qui manquait et causait votre erreur "getAllRestaurants is not a function"
export const getAllRestaurants = async () => {
  try {
    // On limite à 100 pour ne pas saturer la mémoire du téléphone
    return await db.getAllAsync('SELECT * FROM restaurants LIMIT 100');
  } catch (e) {
    console.error("Erreur getAllRestaurants:", e);
    return [];
  }
};

// Fonction optimisée pour la Carte (Bounding Box)
export const getRestaurantsNearby = async (userLat: number, userLon: number, radiusKm: number) => {
  try {
    // 1. Calcul d'un carré autour de l'utilisateur (plus rapide que le calcul de cercle SQL)
    // 1 degré de latitude ~= 111 km
    const latDelta = radiusKm / 111;
    // Correction longitude selon la latitude
    const lonDelta = radiusKm / (111 * Math.cos(userLat * (Math.PI / 180)));

    const minLat = userLat - latDelta;
    const maxLat = userLat + latDelta;
    const minLon = userLon - lonDelta;
    const maxLon = userLon + lonDelta;

    // 2. Requête SQL rapide
    const candidates = await db.getAllAsync(
      `SELECT * FROM restaurants 
       WHERE lat BETWEEN ? AND ? 
       AND lon BETWEEN ? AND ?`,
      [minLat, maxLat, minLon, maxLon]
    );

    // 3. Filtrage précis (Cercle exact) en JavaScript
    const results = candidates.map((r: any) => ({
      ...r,
      distanceKm: getDistanceFromLatLonInKm(userLat, userLon, r.lat, r.lon)
    })).filter((r: any) => r.distanceKm <= radiusKm)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    return results;

  } catch (e) {
    console.error("Erreur getRestaurantsNearby:", e);
    return [];
  }
};

// --- FONCTIONS UTILISATEURS (Pour le Profil) ---

export const createUser = async (username: string, avatar: string = "default") => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (username, avatar, created_at) VALUES (?, ?, ?)',
      [username, avatar, Date.now()]
    );
    console.log("[Mobile DB] User créé ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (e) {
    console.error("Erreur createUser:", e);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    return await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
  } catch (e) {
    console.error("Erreur getUser:", e);
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

// --- UTILITAIRES ---

// Formule de Haversine pour la distance précise en km
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Rayon de la terre
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
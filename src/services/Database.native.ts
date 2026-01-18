import * as SQLite from 'expo-sqlite';
import { UserPreferences } from '../models/PreferencesModel';

// 1. IMPORT ET PRÉPARATION DES DONNÉES JSON
const rawData = require('../data/restaurants.json');

// Sécurisation : on récupère le tableau qu'il soit direct ou dans une clé "restaurants"
const restaurantsList: any[] = Array.isArray(rawData)
  ? rawData
  : (rawData.restaurants || []);

// 2. OUVERTURE DE LA BASE DE DONNÉES
const db = SQLite.openDatabaseSync('food_reco_v2.db');

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
        city TEXT,
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

    // C. Création de la table INTERACTIONS (Pour l'algo)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        cuisine_tag TEXT,
        action_type TEXT, 
        timestamp INTEGER
      );
    `);

    // D. Vérification et Remplissage
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

        // Si on a toujours 0, on ignore ce restaurant (inutile sans GPS)
        if (latitude === 0 && longitude === 0) continue;

        const cuisinesStr = Array.isArray(r.cuisine) ? r.cuisine.join(',') : (r.cuisine || "");
        const isVeg = (r.diet && r.diet.vegetarian) ? 1 : (r.vegetarian === "yes" ? 1 : 0);
        const isVegan = (r.diet && r.diet.vegan) ? 1 : (r.vegan === "yes" ? 1 : 0);
        const isTakeaway = (r.options && r.options.takeaway) ? 1 : (r.takeaway === "yes" ? 1 : 0);

        await db.runAsync(
          `INSERT INTO restaurants (name, type, cuisines, lat, lon, city, vegetarian, vegan, takeaway) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.name || "Inconnu",
            r.type || "restaurant",
            cuisinesStr,
            latitude,
            longitude,
            r.meta_name_com || "",
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

  query += " LIMIT 50"; // Limite pour la performance

  try {
    return await db.getAllAsync(query, params);
  } catch (e) {
    console.error("Erreur searchRestaurants:", e);
    return [];
  }
};

export const getAllRestaurants = async () => {
  try {
    // Limite augmentée pour permettre à l'algo de travailler sur un plus grand jeu de données
    return await db.getAllAsync('SELECT * FROM restaurants LIMIT 3000');
  } catch (e) {
    console.error("Erreur getAllRestaurants:", e);
    return [];
  }
};

// Fonction optimisée pour la Carte (Bounding Box)
export const getRestaurantsNearby = async (userLat: number, userLon: number, radiusKm: number) => {
  try {
    // 1. Calcul d'un carré autour de l'utilisateur
    const latDelta = radiusKm / 111;
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

// --- FONCTIONS UTILISATEURS ---

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

// --- FONCTIONS ALGO / INTERACTIONS ---

// Mise à jour de la signature pour accepter 'view' et 'website'
export const logInteraction = async (
  restaurantId: number,
  cuisine: string,
  action: 'click' | 'call' | 'route' | 'view' | 'website'
) => {
  try {
    await db.runAsync(
      'INSERT INTO interactions (restaurant_id, cuisine_tag, action_type, timestamp) VALUES (?, ?, ?, ?)',
      [restaurantId, cuisine || "unknown", action, Date.now()]
    );
    console.log(`[Interaction] Action '${action}' enregistrée pour cuisine '${cuisine}'`);
  } catch (e) {
    console.error("Erreur logInteraction:", e);
  }
};

export const getUserHabits = async () => {
  try {
    const rows = await db.getAllAsync('SELECT cuisine_tag, COUNT(*) as count FROM interactions GROUP BY cuisine_tag');
    const habits: Record<string, number> = {};

    rows.forEach((r: any) => {
      const tags = (r.cuisine_tag || "").split(',');
      tags.forEach((t: string) => {
        const cleanTag = t.trim().toLowerCase();
        if (cleanTag) {
          habits[cleanTag] = (habits[cleanTag] || 0) + r.count;
        }
      });
    });
    return habits;
  } catch (e) {
    return {};
  }
};

// --- NOUVEAU : Compteur de popularité par restaurant ---
export const getRestaurantPopularity = async () => {
  try {
    // On compte combien de fois chaque ID revient dans la table interactions
    // On filtre sur 'click', 'call', 'route' pour compter les "vraies" interactions actives
    const result = await db.getAllAsync(
      `SELECT restaurant_id, COUNT(*) as count 
       FROM interactions 
       WHERE action_type IN ('click', 'call', 'route', 'website') 
       GROUP BY restaurant_id`
    );

    // Transformation en objet { "101": 5, "102": 12 }
    const popularity: Record<number, number> = {};
    result.forEach((row: any) => {
      popularity[row.restaurant_id] = row.count;
    });

    return popularity;
  } catch (e) {
    console.error("Erreur getRestaurantPopularity:", e);
    return {};
  }
};

// --- UTILITAIRES ---

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

// --- FAVORIS (avec userId et validated) ---

// Initialiser la table favoris avec les nouvelles colonnes
const ensureFavoritesTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favorites_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      user_id TEXT DEFAULT 'default',
      validated INTEGER DEFAULT 0,
      created_at INTEGER,
      UNIQUE(restaurant_id, user_id)
    );
  `);
};

export const addFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    await db.runAsync(
      'INSERT OR IGNORE INTO favorites_v2 (restaurant_id, user_id, validated, created_at) VALUES (?, ?, 0, ?)',
      [restaurantId, uid, Date.now()]
    );
    console.log(`[Mobile DB] Restaurant ${restaurantId} ajouté aux favoris pour user ${uid}`);
  } catch (e) {
    console.error("Erreur addFavorite:", e);
  }
};

export const removeFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    await db.runAsync(
      'DELETE FROM favorites_v2 WHERE restaurant_id = ? AND user_id = ?',
      [restaurantId, uid]
    );
    console.log(`[Mobile DB] Restaurant ${restaurantId} retiré des favoris pour user ${uid}`);
  } catch (e) {
    console.error("Erreur removeFavorite:", e);
  }
};

export const validateFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    await db.runAsync(
      'UPDATE favorites_v2 SET validated = 1 WHERE restaurant_id = ? AND user_id = ?',
      [restaurantId, uid]
    );
    console.log(`[Mobile DB] Restaurant ${restaurantId} validé pour user ${uid}`);
  } catch (e) {
    console.error("Erreur validateFavorite:", e);
  }
};

export const unvalidateFavorite = async (restaurantId: number, userId?: string): Promise<void> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    await db.runAsync(
      'UPDATE favorites_v2 SET validated = 0 WHERE restaurant_id = ? AND user_id = ?',
      [restaurantId, uid]
    );
    console.log(`[Mobile DB] Restaurant ${restaurantId} remis en "À tester" pour user ${uid}`);
  } catch (e) {
    console.error("Erreur unvalidateFavorite:", e);
  }
};

export const getFavorites = async (userId?: string, validated?: boolean): Promise<any[]> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    let query = `
      SELECT r.*, f.validated FROM restaurants r
      INNER JOIN favorites_v2 f ON r.id = f.restaurant_id
      WHERE f.user_id = ?
    `;
    const params: any[] = [uid];

    if (validated !== undefined) {
      query += ' AND f.validated = ?';
      params.push(validated ? 1 : 0);
    }

    query += ' ORDER BY f.created_at DESC';

    const favorites = await db.getAllAsync(query, params);
    console.log(`[Mobile DB] ${favorites.length} favoris récupérés pour user ${uid} (validated=${validated})`);
    return favorites;
  } catch (e) {
    console.error("Erreur getFavorites:", e);
    return [];
  }
};

export const isFavorite = async (restaurantId: number, userId?: string): Promise<boolean> => {
  try {
    await ensureFavoritesTable();
    const uid = userId || 'default';

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM favorites_v2 WHERE restaurant_id = ? AND user_id = ?',
      [restaurantId, uid]
    );
    return (result?.count ?? 0) > 0;
  } catch (e) {
    console.error("Erreur isFavorite:", e);
    return false;
  }
};
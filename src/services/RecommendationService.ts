import * as Location from 'expo-location';
import { getAllRestaurants, getRestaurantsNearby, getUserHabits, getRestaurantPopularity } from "./Database";
import { getPreferences } from "../controllers/PreferencesController";

// --- Poids des critères ---
const SCORE_BASE = 100;
const BONUS_PREFERENCE = 40; 
const BONUS_HABIT = 15;
const BONUS_VISIT = 10;
const MAX_VISIT_BONUS = 50;

// Pénalités
const PENALTY_DIET_MISMATCH = 200;
const PENALTY_DISTANCE = 8;

// --- PARAMÈTRES BANDIT MANCHOT 🎰 ---
// Probabilité d'explorer (Epsilon). 0.2 = 20% de chance qu'un restaurant soit un "Explorer"
const EXPLORATION_PROBABILITY = 0.2; 
// Bonus massif pour propulser l'outsider en haut de liste
const EXPLORATION_BOOST = 60; 

// Définition des types
type HabitsMap = Record<string, number>;
type PopularityMap = Record<number, number>;

// Cache
let memoizedCache: {
  lat: number;
  lon: number;
  data: any[];
  timestamp: number;
} | null = null;

export const getAdaptiveRecommendations = async (
  forceLat?: number, 
  forceLon?: number, 
  radiusKm: number = 20
) => {
  console.log("--- 🧠 Algo V4 : Multi-Armed Bandit (Exploration/Exploitation) ---");

  // 1. Récupération de la position
  let userLoc = null;
  if (forceLat && forceLon) {
      userLoc = { lat: forceLat, lon: forceLon };
  } else {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
            let loc = await Location.getLastKnownPositionAsync({}); 
            if (!loc) {
                loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            }
            if (loc) {
                userLoc = { lat: loc.coords.latitude, lon: loc.coords.longitude };
            }
        }
      } catch (e) {
          console.warn("Erreur Position:", e);
      }
  }

  // Vérification du Cache
  if (userLoc && memoizedCache) {
      const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lon, memoizedCache.lat, memoizedCache.lon);
      if (dist < 0.1 && (Date.now() - memoizedCache.timestamp < 5 * 60 * 1000)) {
          return memoizedCache.data;
      }
  }

  // 2. Chargement des données
  let rawData: any[] = [];
  if (userLoc) {
      rawData = await getRestaurantsNearby(userLoc.lat, userLoc.lon, radiusKm);
  } else {
      rawData = await getAllRestaurants();
  }

  // 3. Récupération des données utilisateur
  const [rawHabits, rawPopularity, prefs] = await Promise.all([
    getUserHabits(),
    getRestaurantPopularity(), 
    getPreferences()
  ]);

  const habits: HabitsMap = (typeof rawHabits === 'object' && rawHabits !== null) ? rawHabits as HabitsMap : {};
  const popularity: PopularityMap = (typeof rawPopularity === 'object' && rawPopularity !== null) ? rawPopularity as PopularityMap : {};

  // 4. Calcul du Score "Standard" (Exploitation)
  let scoredData = rawData.map((resto: any) => {
    let score = SCORE_BASE;
    // Bruit aléatoire très faible juste pour éviter les égalités parfaites
    score += Math.random(); 

    let details: string[] = [];
    let isExplorable = true; // Candidat potentiel pour le Bandit ?

    const cuisines = (resto.cuisines || "").toLowerCase().split(',');
    const type = (resto.type || "").toLowerCase();
    const tags = [...cuisines, type].map(t => t.trim()).filter(t => t);

    // A. Régime Alimentaire (Critique)
    if (prefs.diet && prefs.diet !== "Aucune") {
        const isVeggie = resto.vegetarian === 1 || resto.vegetarian === true || tags.includes("vegan") || tags.includes("vegetarien");
        if ((prefs.diet === "Végétarien" || prefs.diet === "Végan") && !isVeggie) {
            score -= PENALTY_DIET_MISMATCH;
            details.push("Incompatible");
            isExplorable = false; // On n'explore jamais un truc incompatible
        }
    }

    // B. Fidélité
    if (resto.id && popularity[resto.id]) {
        const visitCount = popularity[resto.id];
        const visitBonus = Math.min(visitCount * BONUS_VISIT, MAX_VISIT_BONUS);
        score += visitBonus;
        if(visitBonus > 0) {
            details.push(`Habitué (${visitCount})`);
            isExplorable = false; // On ne "découvre" pas un endroit qu'on connait déjà
        }
    }

    // C. Habitudes & Préférences
    let matchesTaste = false;
    tags.forEach((tag: string) => {
        if (tag && habits[tag]) {
            score += Math.min(40, habits[tag] * BONUS_HABIT);
            matchesTaste = true;
        }
    });
    
    if (prefs.cuisines && prefs.cuisines.length > 0) {
        if (tags.some((t: string) => prefs.cuisines.map(c => c.toLowerCase()).includes(t))) {
            score += BONUS_PREFERENCE;
            matchesTaste = true;
            details.push(`Préférence`);
        }
    }
    
    if (matchesTaste) details.push("Genre aimé");

    // D. Distance
    if (userLoc && typeof resto.lat === 'number') {
        const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lon, resto.lat, resto.lon);
        score -= Math.floor(dist * PENALTY_DISTANCE);
        resto.distanceKm = dist; 
    }

    return { 
        ...resto, 
        score, 
        debugInfo: details,
        isExplorable // On garde cette info pour l'étape suivante
    };
  });

  // 5. 🎰 STRATÉGIE BANDIT MANCHOT (Exploration)
  // On choisit UN candidat à explorer (parmi ceux qui sont explorables et valides)
  const candidates = scoredData.filter(r => r.isExplorable && r.score > 0);
  
  if (candidates.length > 0) {
      // On lance le dé (Epsilon-Greedy)
      const shouldExplore = Math.random() < EXPLORATION_PROBABILITY;
      
      if (shouldExplore) {
          // On prend un candidat au hasard
          const winnerIndex = Math.floor(Math.random() * candidates.length);
          const explorerId = candidates[winnerIndex].id;

          // On applique le boost uniquement à lui
          scoredData = scoredData.map(r => {
              if (r.id === explorerId) {
                  return {
                      ...r,
                      score: r.score + EXPLORATION_BOOST,
                      debugInfo: ["✨ Découverte du jour 🎲", ...r.debugInfo]
                  };
              }
              return r;
          });
          console.log(`[Bandit] Exploration activée pour le resto ID ${explorerId}`);
      }
  }

  // 6. Tri Final et Nettoyage
  const finalResult = scoredData
    .filter((r: any) => r.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .map((r: any) => ({
        ...r,
        // On aplatit le tableau de détails pour l'affichage final
        debugInfo: Array.isArray(r.debugInfo) ? r.debugInfo.join(', ') : r.debugInfo
    }));

  // Mise à jour du cache
  if (userLoc) {
      memoizedCache = {
          lat: userLoc.lat,
          lon: userLoc.lon,
          data: finalResult,
          timestamp: Date.now()
      };
  }

  return finalResult;
};

// --- Utilitaires ---
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};
const deg2rad = (deg: number) => deg * (Math.PI/180);
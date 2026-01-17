import * as Location from 'expo-location';
import { getAllRestaurants, getRestaurantsNearby, getUserHabits, getRestaurantPopularity } from "./Database";
import { getPreferences } from "../controllers/PreferencesController";

// Poids des critères
const SCORE_BASE = 100;
const BONUS_PREFERENCE = 50;
const BONUS_HABIT = 20;
const PENALTY_DISTANCE = 5;

// --- AJOUT : Nouveau poids pour la fidélité ---
const BONUS_VISIT = 15;
const MAX_VISIT_BONUS = 60;

// Définition des types pour éviter les erreurs "Implicit Any"
type HabitsMap = Record<string, number>;
type PopularityMap = Record<number, number>;

// Variable de Cache
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
  console.log("--- 🧠 Algo Adaptatif Intelligent (Optimisé V2 + Fidélité) ---");

  // 1. Récupération de la position
  let userLoc = null;
  if (forceLat && forceLon) {
      userLoc = { lat: forceLat, lon: forceLon };
  } else {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
            
            // CORRECTION "Expected 1 argument" : On passe un objet vide explicite ou rien selon la version
            // Si votre version d'Expo râle sur {}, essayez sans argument : getLastKnownPositionAsync()
            let loc = await Location.getLastKnownPositionAsync({}); 

            if (!loc) {
                console.log("[GPS] Pas de cache, demande active...");
                loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
            }
            
            if (loc) {
                userLoc = { lat: loc.coords.latitude, lon: loc.coords.longitude };
            }
        }
      } catch (e) {
          console.warn("Erreur Position:", e);
      }
  }

  // --- Vérification du Cache ---
  if (userLoc && memoizedCache) {
      const dist = getDistanceFromLatLonInKm(
          userLoc.lat, userLoc.lon, 
          memoizedCache.lat, memoizedCache.lon
      );
      if (dist < 0.2) {
          return memoizedCache.data;
      }
  }

  // 2. Chargement des données brutes
  let rawData: any[] = [];
  if (userLoc) {
      rawData = await getRestaurantsNearby(userLoc.lat, userLoc.lon, radiusKm);
  } else {
      rawData = await getAllRestaurants();
  }

  // 3. Récupération des données utilisateur avec TYPAGE EXPLICITE
  // CORRECTION "Index type Number" : On force le type ici pour rassurer TypeScript
  const [rawHabits, rawPopularity, prefs] = await Promise.all([
    getUserHabits(),
    getRestaurantPopularity(), 
    getPreferences()
  ]);

  // Sécurisation : on s'assure que ce sont bien des objets
  const habits: HabitsMap = (typeof rawHabits === 'object' && rawHabits !== null) ? rawHabits as HabitsMap : {};
  const popularity: PopularityMap = (typeof rawPopularity === 'object' && rawPopularity !== null) ? rawPopularity as PopularityMap : {};

  console.log(`Données : ${rawData.length} restos, ${Object.keys(habits).length} habitudes, ${Object.keys(popularity).length} favoris.`);

  // 4. Calcul du score
  const scoredData = rawData.map((resto: any) => {
    let score = SCORE_BASE;
    let details: string[] = [];

    // A. Fidélité
    // TypeScript sait maintenant que popularity est un Record<number, number>
    if (resto.id && popularity[resto.id]) {
        const visitCount = popularity[resto.id];
        const visitBonus = Math.min(visitCount * BONUS_VISIT, MAX_VISIT_BONUS);
        score += visitBonus;
        details.push(`Fidélité (${visitCount}x)`);
    }

    // B. Habitudes
    const cuisines = (resto.cuisines || "").toLowerCase().split(',');
    const type = (resto.type || "").toLowerCase();
    [...cuisines, type].forEach((tag: string) => {
        const t = tag.trim();
        // TypeScript sait maintenant que habits est un Record<string, number>
        if (t && habits[t]) {
            const pts = Math.min(50, habits[t] * BONUS_HABIT);
            score += pts;
            details.push(`Habitude`);
        }
    });

    // C. Préférences
    if (prefs.cuisines && prefs.cuisines.length > 0) {
        const isPreferred = [...cuisines, type].some(t => 
            prefs.cuisines.map(c => c.toLowerCase()).includes(t.trim())
        );
        if (isPreferred) {
            score += BONUS_PREFERENCE;
            details.push(`Pref`);
        }
    }

    // D. Distance
    if (userLoc && typeof resto.lat === 'number') {
        const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lon, resto.lat, resto.lon);
        score -= Math.floor(dist * PENALTY_DISTANCE);
        resto.distanceKm = dist; 
    }

    return { ...resto, score, debugInfo: details.join(', ') };
  });

  // 5. Tri
  const finalResult = scoredData.sort((a, b) => b.score - a.score);

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
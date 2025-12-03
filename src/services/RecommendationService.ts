import * as Location from 'expo-location';
import { getAllRestaurants, getRestaurantsNearby, getUserHabits } from "./Database";
import { getPreferences } from "../controllers/PreferencesController";

// Poids des critères
const SCORE_BASE = 100;
const BONUS_PREFERENCE = 50;
const BONUS_HABIT = 20;
const PENALTY_DISTANCE = 5;

// L'algo accepte maintenant des paramètres optionnels de position
export const getAdaptiveRecommendations = async (
  forceLat?: number, 
  forceLon?: number, 
  radiusKm: number = 20 // Rayon par défaut assez large pour la liste (20km)
) => {
  console.log("--- 🧠 Algo Adaptatif Intelligent ---");

  // 1. Récupération de la position (Si non fournie)
  let userLoc = null;
  if (forceLat && forceLon) {
      userLoc = { lat: forceLat, lon: forceLon };
  } else {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            userLoc = { lat: loc.coords.latitude, lon: loc.coords.longitude };
        }
      } catch (e) {}
  }

  // 2. CHOIX DE LA SOURCE DE DONNÉES (C'est ici la correction !)
  let rawData = [];
  
  if (userLoc) {
      // CAS A : On a une position -> On prend les restos autour (comme la Map !)
      console.log("Mode GPS : Chargement via getRestaurantsNearby...");
      rawData = await getRestaurantsNearby(userLoc.lat, userLoc.lon, radiusKm);
  } else {
      // CAS B : Pas de position -> On prend la liste globale
      console.log("Mode Global : Chargement via getAllRestaurants...");
      rawData = await getAllRestaurants();
  }

  const [habits, prefs] = await Promise.all([
    getUserHabits(),
    getPreferences()
  ]);

  console.log(`Données brutes : ${rawData.length} restaurants à trier.`);

  // 3. Calcul du score (Identique à avant)
  const scoredData = rawData.map((resto: any) => {
    let score = SCORE_BASE;
    let details = [];

    // Habitudes
    const cuisines = (resto.cuisines || "").toLowerCase().split(',');
    const type = (resto.type || "").toLowerCase();
    [...cuisines, type].forEach((tag: string) => {
        const t = tag.trim();
        if (habits[t]) {
            const pts = Math.min(50, habits[t] * BONUS_HABIT); // Plafond
            score += pts;
            details.push(`Habitude +${pts}`);
        }
    });

    // Préférences
    if (prefs.cuisines && prefs.cuisines.length > 0) {
        const isPreferred = [...cuisines, type].some(t => 
            prefs.cuisines.map(c => c.toLowerCase()).includes(t.trim())
        );
        if (isPreferred) {
            score += BONUS_PREFERENCE;
            details.push(`Pref +${BONUS_PREFERENCE}`);
        }
    }

    // Distance
    if (userLoc && typeof resto.lat === 'number') {
        const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lon, resto.lat, resto.lon);
        // Pénalité plus douce
        const penalty = Math.floor(dist * PENALTY_DISTANCE);
        score -= penalty;
        // On stocke la distance pour l'affichage
        resto.distanceKm = dist; 
    }

    return { ...resto, score, debugInfo: details.join(', ') };
  });

  // 4. Tri
  return scoredData.sort((a, b) => b.score - a.score);
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
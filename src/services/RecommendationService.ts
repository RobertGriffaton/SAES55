import * as Location from 'expo-location';
import { getAllRestaurants, getRestaurantsNearby, getUserHabits, getRestaurantPopularity, resetAllInteractions } from "./Database";
import { getPreferences } from "../controllers/PreferencesController";

// --- Poids des critères (OPTIMISÉS pour plus de diversité) ---
const SCORE_BASE = 100;
const BONUS_PREFERENCE = 25; // Réduit de 40 à 25 pour éviter la domination
const BONUS_HABIT = 10; // Réduit de 15 à 10
const BONUS_VISIT = 10;
const MAX_VISIT_BONUS = 50;

// Pénalités
const PENALTY_DIET_MISMATCH = 200;
const PENALTY_DISTANCE = 8;

// --- PARAMÈTRES BANDIT MANCHOT 🎰 (OPTIMISÉS) ---
// Probabilité d'explorer (Epsilon). 0.35 = 35% de chance qu'un restaurant soit un "Explorer"
const EXPLORATION_PROBABILITY = 0.35; // Augmenté de 0.2 à 0.35
// Bonus massif pour propulser l'outsider en haut de liste
const EXPLORATION_BOOST = 60;

// --- PARAMÈTRES DE DIVERSITÉ ---
const MIN_CUISINE_TYPES = 8; // Minimum de types de cuisine différents dans le top 50
const DIVERSITY_BOOST = 40; // Boost pour forcer la diversité

// --- PARAMÈTRES DE FILTRAGE PAR NOTES ---
const MIN_SCORE_THRESHOLD = 50; // Score minimum pour être inclus dans les résultats
const MAX_SCORE_THRESHOLD = 500; // Score maximum (plafond)

// --- MAPPING PRÉFÉRENCES -> TAGS RESTAURANTS ---
// Les IDs de préférences utilisateur doivent correspondre aux tags des restaurants
const CUISINE_TAG_MAPPING: Record<string, string[]> = {
    "Amérique": ["burger", "americain", "fast_food", "usa"],
    "Américain": ["americain", "burger", "fast_food", "usa"],
    "Japonais": ["japonais", "sushi", "ramen", "japanese"],
    "Italien": ["italien", "pizza", "italiano", "pasta"],
    "Europe": ["healthy", "europeen", "salade", "bio"],
    "Maghreb": ["kebab", "maghreb", "oriental", "halal"],
    "Mexique": ["mexicain", "tacos", "mexican", "tex-mex"],
    "Français": ["francais", "french", "bistrot", "brasserie"],
    "Chinois": ["chinois", "chinese", "asiatique"],
    "Asiatique": ["asiatique", "asian", "wok", "noodles"],
    "Thai": ["thai", "thailandais"],
    "Vietnamien": ["vietnamien", "pho", "vietnamese"],
    "Coréen": ["coreen", "korean", "bbq coréen"],
    "Afrique": ["africain", "afrique", "african"],
    "Oriental": ["oriental", "libanais", "turc", "falafel"],
    "Grec": ["grec", "greek", "gyros"],
    "Latino": ["latino", "sud-americain", "bresilien"],
    "Poulet": ["poulet", "chicken", "fried chicken"],
    "Sandwich": ["sandwich", "panini", "sub"],
    "FastFood": ["fast_food", "burger", "quick", "kfc", "mcdo"],
    "Café": ["cafe", "coffee", "salon de thé"],
    "Pâtisserie": ["patisserie", "dessert", "gateau"],
    "Crêperie": ["creperie", "crepe", "galette"],
    "Grill": ["grill", "viande", "steakhouse"],
    "FruitsDeMer": ["fruits_de_mer", "poisson", "seafood"],
    "Espagnol": ["espagnol", "spanish", "tapas"],
    "Turc": ["turc", "turkish", "kebab"],
    "Créole": ["creole", "antillais", "caribbean"],
    "Méditerranéen": ["mediterraneen", "mediterranean", "grec", "libanais"],
    "BubbleTea": ["bubble_tea", "boba", "thé"],
    "Inde": ["indien", "indian", "curry"],
    "Libanais": ["libanais", "lebanese", "mezze"],
};

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

// Flag global pour signaler qu'un refresh est nécessaire (pour mobile)
let needsRefresh = false;

/**
 * Vide le cache des recommandations pour forcer un recalcul
 * ET réinitialise toutes les interactions (scores de popularité)
 * Appelé quand les préférences changent dans Settings
 * Cela permet aux nouveaux restaurants de ne pas être dominés par l'historique
 */
export const clearRecommendationCache = async () => {
    memoizedCache = null;
    needsRefresh = true;

    // Réinitialiser les interactions pour repartir à zéro
    await resetAllInteractions();

    console.log("[Algo] Cache vidé + interactions réinitialisées - recalcul au prochain appel");
};

/**
 * Vérifie si un refresh est nécessaire et réinitialise le flag
 */
export const checkAndResetRefreshFlag = (): boolean => {
    const shouldRefresh = needsRefresh;
    needsRefresh = false;
    return shouldRefresh;
};

export const getAdaptiveRecommendations = async (
    forceLat?: number,
    forceLon?: number,
    radiusKm: number = 20,
    minScore?: number,
    maxScore?: number
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

    // Vérification du Cache (RÉDUIT à 1 minute pour plus de fraîcheur)
    if (userLoc && memoizedCache) {
        const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lon, memoizedCache.lat, memoizedCache.lon);
        if (dist < 0.1 && (Date.now() - memoizedCache.timestamp < 60 * 1000)) { // 1 minute au lieu de 5
            console.log("[Cache] Utilisation du cache (< 1 min)");
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
    // Système anti-répétition : seed basé sur la date + heure (change toutes les heures)
    const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60)); // Change chaque heure
    const seededRandom = (index: number) => {
        const x = Math.sin(hourSeed * index) * 10000;
        return x - Math.floor(x);
    };

    let scoredData = rawData.map((resto: any, index: number) => {
        let score = SCORE_BASE;
        // Bruit aléatoire AUGMENTÉ pour plus de variété (0-5 points)
        score += seededRandom(index) * 5;

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
            if (visitBonus > 0) {
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
            // Utiliser le mapping pour convertir les préférences utilisateur en tags de restaurant
            const userTagsExpanded: string[] = [];
            prefs.cuisines.forEach((cuisine: string) => {
                const mappedTags = CUISINE_TAG_MAPPING[cuisine];
                if (mappedTags) {
                    userTagsExpanded.push(...mappedTags);
                }
                // Ajouter aussi le nom de la cuisine en minuscule au cas où
                userTagsExpanded.push(cuisine.toLowerCase());
            });

            // Vérifier si un tag du restaurant correspond aux préférences utilisateur
            if (tags.some((t: string) => userTagsExpanded.includes(t))) {
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

    // 6. 🌈 SYSTÈME DE DIVERSITÉ DES CUISINES (VERSION STRICTE)
    // Au lieu de compter les types, on limite le nombre de restos par type dans le top 50
    const MAX_PER_CUISINE = 10; // Maximum 10 restaurants du même type dans le top 50

    // Appliquer les filtres de score min/max
    const scoreMin = minScore ?? MIN_SCORE_THRESHOLD;
    const scoreMax = maxScore ?? MAX_SCORE_THRESHOLD;

    // Trier par score pour avoir le top initial
    const sortedByScore = [...scoredData]
        .filter((r: any) => r.score > 0 && r.score >= scoreMin && r.score <= scoreMax)
        .sort((a: any, b: any) => b.score - a.score);

    // Compter les restaurants par type de cuisine principal (premier tag)
    const cuisineCount = new Map<string, number>();
    const diverseTop20: any[] = [];
    const overflow: any[] = []; // Restaurants exclus pour diversité

    sortedByScore.forEach((resto: any) => {
        if (diverseTop20.length >= 50) {
            overflow.push(resto);
            return;
        }

        // Identifier le type de cuisine principal
        const cuisines = (resto.cuisines || resto.type || "inconnu").toLowerCase().split(',');
        const mainCuisine = cuisines[0]?.trim() || "inconnu";

        const currentCount = cuisineCount.get(mainCuisine) || 0;

        // Si on a déjà trop de ce type, on le met en overflow
        if (currentCount >= MAX_PER_CUISINE) {
            overflow.push(resto);
            console.log(`[Diversité] "${resto.name}" (${mainCuisine}) exclu - quota atteint (${currentCount}/${MAX_PER_CUISINE})`);
        } else {
            diverseTop20.push(resto);
            cuisineCount.set(mainCuisine, currentCount + 1);
        }
    });

    // Si on n'a pas 50 restaurants, on complète avec l'overflow
    if (diverseTop20.length < 50 && overflow.length > 0) {
        const needed = 50 - diverseTop20.length;
        diverseTop20.push(...overflow.slice(0, needed));
        console.log(`[Diversité] Complété avec ${needed} restaurants de l'overflow`);
    }

    // Afficher les stats de diversité
    console.log(`[Diversité] Distribution dans le top 50:`);
    console.log(`[Filtres] Score min: ${scoreMin}, Score max: ${scoreMax}`);
    Array.from(cuisineCount.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([cuisine, count]) => {
            console.log(`  - ${cuisine}: ${count} restaurants`);
        });

    // Remplacer scoredData par notre version diversifiée
    scoredData = diverseTop20;

    // 7. Tri Final et Nettoyage
    const finalResult = scoredData
        .filter((r: any) => r.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .map((r: any) => ({
            ...r,
            // On aplatit le tableau de détails pour l'affichage final
            debugInfo: Array.isArray(r.debugInfo) ? r.debugInfo.join(', ') : r.debugInfo
        }));

    // 📊 LOGS DÉTAILLÉS DU CLASSEMENT
    console.log("\n========================================");
    console.log("📊 CLASSEMENT DES RESTAURANTS (Top 50)");
    console.log("========================================");

    finalResult.slice(0, 50).forEach((resto: any, index: number) => {
        const cuisines = resto.cuisines || resto.type || "Non spécifié";
        const score = resto.score.toFixed(2);
        const distance = resto.distanceKm ? `${resto.distanceKm.toFixed(1)}km` : "N/A";
        const details = resto.debugInfo || "Aucun détail";

        console.log(`\n${index + 1}. ${resto.name}`);
        console.log(`   🍽️  Cuisine: ${cuisines}`);
        console.log(`   ⭐ Score: ${score}`);
        console.log(`   📍 Distance: ${distance}`);
        console.log(`   ℹ️  Détails: ${details}`);
    });

    // 📈 STATISTIQUES DES CUISINES
    console.log("\n========================================");
    console.log("📈 CLASSEMENT DES TYPES DE CUISINE");
    console.log("========================================");

    const cuisineStats = new Map<string, { count: number; avgScore: number; totalScore: number }>();

    finalResult.forEach((resto: any) => {
        const cuisines = (resto.cuisines || resto.type || "inconnu").toLowerCase().split(',');
        cuisines.forEach((cuisine: string) => {
            const trimmed = cuisine.trim();
            if (!trimmed) return;

            const current = cuisineStats.get(trimmed) || { count: 0, avgScore: 0, totalScore: 0 };
            current.count += 1;
            current.totalScore += resto.score;
            current.avgScore = current.totalScore / current.count;
            cuisineStats.set(trimmed, current);
        });
    });

    const sortedCuisines = Array.from(cuisineStats.entries())
        .sort((a, b) => b[1].avgScore - a[1].avgScore)
        .slice(0, 15);

    sortedCuisines.forEach(([cuisine, stats], index) => {
        console.log(`${index + 1}. ${cuisine.toUpperCase()}`);
        console.log(`   Nombre: ${stats.count} restaurants`);
        console.log(`   Score moyen: ${stats.avgScore.toFixed(2)}`);
    });

    console.log("\n========================================\n");

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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const deg2rad = (deg: number) => deg * (Math.PI / 180);
import { ImageSourcePropType } from "react-native";

// --- MAPPING DES IMAGES ---
// Les valeurs peuvent être soit une image unique, soit un TABLEAU d'images [ ]
export const CATEGORY_IMAGES: Record<string, any> = {
  // --- MARQUES (Priorité Haute - Image Unique) ---
  "mcdonald's": require("../../assets/imagescover/mcdo.png"),
  "kfc": require("../../assets/imagescover/kfc.png"),
  "quick": require("../../assets/imagescover/quick.png"),
  "starbucks": require("../../assets/imagescover/starbucks.png"),
  "subway": require("../../assets/imagescover/subway.png"),
  "chicken_spot": require("../../assets/imagescover/chickenspot.png"),
  "burger_king": require("../../assets/imagescover/burgerking.png"),

  // --- CATÉGORIES AVEC VARIATIONS (Tableaux d'images) ---
  "burger": [
    require("../../assets/imagescover/burger.png"),
    require("../../assets/imagescover/burger2.png"),
    // require("../../assets/imagescover/burger3.png"),
  ],
  "pizza": [
    require("../../assets/imagescover/pizza.png"),
    require("../../assets/imagescover/pizza2.png"),
  ],
  "japonais": [
    require("../../assets/imagescover/japonais.png"),
    // require("../../assets/imagescover/sushi.png"),
  ],

  // --- CATÉGORIES GÉNÉRIQUES (Image Unique) ---
  "francais": require("../../assets/imagescover/francais.png"),
  "italien": require("../../assets/imagescover/italien.png"),
  "asiatique": require("../../assets/imagescover/asiatique.png"),
  "kebab": require("../../assets/imagescover/kebab.png"),
  "chinois": require("../../assets/imagescover/chinois.png"),
  "sandwich": require("../../assets/imagescover/sandwich.png"),
  "cafe": require("../../assets/imagescover/cafe.png"),
  "asie_du_sud": require("../../assets/imagescover/asie_du_sud.png"),
  "creperie": require("../../assets/imagescover/creperie.png"),
  "thai": require("../../assets/imagescover/thai.png"),
  "poulet": require("../../assets/imagescover/poulet.png"),
  "vietnamien": require("../../assets/imagescover/vietnamien.png"),
  "middle_eastern": require("../../assets/imagescover/middle_eastern.png"),
  "oriental": require("../../assets/imagescover/oriental.png"),
  "healthy": require("../../assets/imagescover/healthy.png"),
  "latino": require("../../assets/imagescover/latino.png"),
  "coreen": require("../../assets/imagescover/coreen.png"),
  "turkish": require("../../assets/imagescover/turkish.png"),
  "grill": require("../../assets/imagescover/grill.png"),
  "patisserie": require("../../assets/imagescover/patisserie.png"),
  "europeen": require("../../assets/imagescover/europeen.png"),
  "fast_food": require("../../assets/imagescover/fast_food.png"),
  "africain": require("../../assets/imagescover/africain.png"),
  "bubble_tea": require("../../assets/imagescover/bubble_tea.png"),
  "fruits_de_mer": require("../../assets/imagescover/fruits_de_mer.png"),
  "americain": require("../../assets/imagescover/americain.png"),
  "divers": require("../../assets/imagescover/divers.png"),
  "mediterranean": require("../../assets/imagescover/mediterranean.png"),
  "grec": require("../../assets/imagescover/grec.png"),
  "espagnol": require("../../assets/imagescover/espagnol.png"),
  "tacos": require("../../assets/imagescover/tacos.png"),
  "creole": require("../../assets/imagescover/creole.png"),
  "balkans": require("../../assets/imagescover/balkans.png"),
  "bar": require("../../assets/imagescover/bar.png"),
};

/**
 * Récupère l'image appropriée pour un restaurant.
 * Utilise un hachage stable basé sur le nom (ou l'ID) pour que le même restaurant
 * ait toujours la même image, même si elle est choisie aléatoirement parmi plusieurs variantes.
 */
export const getRestaurantImage = (restaurant: any): ImageSourcePropType | null => {
  if (!restaurant) return null;

  let candidates: string[] = [];

  // 1. PRIORITÉ : MARQUE
  if (restaurant.brand) {
    candidates.push(String(restaurant.brand));
  }
  // 2. PRIORITÉ : NOM
  if (restaurant.name) {
    candidates.push(String(restaurant.name));
  }

  // 3. CUISINES
  const cuisinesData = restaurant.cuisines || restaurant.cuisine;
  if (cuisinesData) {
    const cuisineString = Array.isArray(cuisinesData) ? cuisinesData.join(",") : String(cuisinesData);
    candidates = [...candidates, ...cuisineString.split(",")];
  }

  // 4. TYPE
  if (restaurant.type) {
    candidates.push(String(restaurant.type));
  }

  for (const rawKey of candidates) {
    const cleanKey = rawKey
      .trim()
      .toLowerCase()
      .replace(/ /g, "_")
      .replace(/-/g, "_");

    // Test exact
    let found = CATEGORY_IMAGES[cleanKey];

    // Test sans apostrophe
    if (!found) {
      const noApostrophe = cleanKey.replace(/'/g, "");
      found = CATEGORY_IMAGES[noApostrophe];
    }

    if (found) {
      // --- LOGIQUE HASARD STABLE ---
      // Si c'est un tableau, on choisit une image basée sur le nom du restaurant.
      if (Array.isArray(found)) {
        // Utilisation de l'ID s'il est numérique pour une meilleure distribution, sinon le nom
        const seed = (restaurant.id && typeof restaurant.id === 'number') ? restaurant.id : (restaurant.name || "default");
        
        // Si c'est un nombre (ID), on l'utilise directement
        if (typeof seed === 'number') {
           const index = seed % found.length;
           return found[index];
        }

        // Sinon (String), on fait un hash
        let hash = 0;
        const stringSeed = String(seed);
        for (let i = 0; i < stringSeed.length; i++) {
          hash = stringSeed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % found.length;
        return found[index];
      }

      // Si c'est une image unique
      return found;
    }
  }
  return null;
};

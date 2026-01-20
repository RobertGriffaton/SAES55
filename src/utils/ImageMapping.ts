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
  "dominos": require("../../assets/imagescover/dominos.png"),
  

  // --- CATÉGORIES AVEC VARIATIONS (Tableaux d'images) ---
  "burger": [
    require("../../assets/imagescover/burger.png"),
    require("../../assets/imagescover/burger2.png"),
    require("../../assets/imagescover/burger3.png"),
    require("../../assets/imagescover/burger4.png"),
    require("../../assets/imagescover/burger5.png"),

  ],
  "pizza": [
    require("../../assets/imagescover/pizza.png"),
    require("../../assets/imagescover/pizza2.png"),
    require("../../assets/imagescover/pizza3.png"),
    require("../../assets/imagescover/pizza4.png"),
    require("../../assets/imagescover/pizza5.png"),

  ],
  "japonais": [
    require("../../assets/imagescover/japonais.png"),
    require("../../assets/imagescover/japonais2.png"), 
    require("../../assets/imagescover/japonais3.png"),
    require("../../assets/imagescover/japonais4.png"),
    require("../../assets/imagescover/japonais5.png"),
  ],

  "francais": [
    require("../../assets/imagescover/francais.png"), 
    require("../../assets/imagescover/francais2.png"),
    require("../../assets/imagescover/francais3.png"),
    require("../../assets/imagescover/francais4.png"),
    require("../../assets/imagescover/francais5.png"),
  ],

  "italien": [
    require("../../assets/imagescover/italien.png"), 
    require("../../assets/imagescover/italien2.png"),
    require("../../assets/imagescover/italien3.png"),
    require("../../assets/imagescover/italien4.png"),
    require("../../assets/imagescover/italien5.png"),
    
  ],
  
    "asiatique": [
    require("../../assets/imagescover/asiatique.png"), 
    require("../../assets/imagescover/asiatique2.png"),
    require("../../assets/imagescover/asiatique3.png"),
    require("../../assets/imagescover/asiatique4.png"),
    require("../../assets/imagescover/asiatique5.png"),
  
  ],
  
    "kebab": [
    require("../../assets/imagescover/kebab.png"), 
    require("../../assets/imagescover/kebab2.png"),
    require("../../assets/imagescover/kebab3.png"),
    require("../../assets/imagescover/kebab4.png"),
    require("../../assets/imagescover/kebab5.png"),
  
  ],
  
    "chinois": [
      require("../../assets/imagescover/chinois.png"), 
      require("../../assets/imagescover/chinois2.png"),
      require("../../assets/imagescover/chinois3.png"),
      require("../../assets/imagescover/chinois4.png"),
      require("../../assets/imagescover/chinois5.png"),

    ],
  
    "sandwich": [
      require("../../assets/imagescover/sandwich.png"), 
      require("../../assets/imagescover/sandwich2.png"),
      require("../../assets/imagescover/sandwich3.png"),
      require("../../assets/imagescover/sandwich4.png"),
      require("../../assets/imagescover/sandwich5.png"),

    ],
  
    "cafe": [
      require("../../assets/imagescover/cafe.png"), 
      require("../../assets/imagescover/cafe2.png"),
      require("../../assets/imagescover/cafe3.png"),
      require("../../assets/imagescover/cafe4.png"),
      require("../../assets/imagescover/cafe5.png"),

    ],
  
    "asie_du_sud": [
      require("../../assets/imagescover/asie_du_sud.png"), 
      require("../../assets/imagescover/asie_du_sud2.png"),
      require("../../assets/imagescover/asie_du_sud3.png"),
      require("../../assets/imagescover/asie_du_sud4.png"),
      require("../../assets/imagescover/asie_du_sud5.png"),
    ],
  
    "creperie": [
      require("../../assets/imagescover/creperie.png"),
      require("../../assets/imagescover/creperie2.png"),
      require("../../assets/imagescover/creperie3.png"),
      require("../../assets/imagescover/creperie4.png"),
      require("../../assets/imagescover/creperie5.png"),
    ],
  
    "thai": [
      require("../../assets/imagescover/thai.png"), 
      require("../../assets/imagescover/thai2.png"),
      require("../../assets/imagescover/thai3.png"),
      require("../../assets/imagescover/thai4.png"),
      require("../../assets/imagescover/thai5.png"),

    ],
  
    "poulet": [
      require("../../assets/imagescover/poulet.png"), 
      require("../../assets/imagescover/poulet2.png"),
      require("../../assets/imagescover/poulet3.png"),
      require("../../assets/imagescover/poulet4.png"),
      require("../../assets/imagescover/poulet5.png"),
    ],
  
    "vietnamien": [
      require("../../assets/imagescover/vietnamien.png"), 
      require("../../assets/imagescover/vietnamien2.png"),
      require("../../assets/imagescover/vietnamien3.png"),
      require("../../assets/imagescover/vietnamien4.png"),
      require("../../assets/imagescover/vietnamien5.png"),
    ],
  
    "middle_eastern": [
      require("../../assets/imagescover/middle_eastern.png"), 
      require("../../assets/imagescover/middle_eastern2.png"),
      require("../../assets/imagescover/middle_eastern3.png"),
      require("../../assets/imagescover/middle_eastern4.png"),
      require("../../assets/imagescover/middle_eastern5.png"),
    ],
  
    "oriental": [
      require("../../assets/imagescover/oriental.png"), 
      require("../../assets/imagescover/oriental2.png"),
      require("../../assets/imagescover/oriental3.png"),
      require("../../assets/imagescover/oriental4.png"),
      require("../../assets/imagescover/oriental5.png"),

    ],
  
    "healthy": [
      require("../../assets/imagescover/healthy.png"), 
      require("../../assets/imagescover/healthy2.png"),
      require("../../assets/imagescover/healthy3.png"),
      require("../../assets/imagescover/healthy4.png"),
      require("../../assets/imagescover/healthy5.png"),

    ],
  
    "latino": [
      require("../../assets/imagescover/latino.png"), 
      require("../../assets/imagescover/latino2.png"),
      require("../../assets/imagescover/latino3.png"),
      require("../../assets/imagescover/latino4.png"), 
      require("../../assets/imagescover/latino5.png"),
    ],
  
    "coreen": [
      require("../../assets/imagescover/coreen.png"), 
      require("../../assets/imagescover/coreen2.png"),
      require("../../assets/imagescover/coreen3.png"),
      require("../../assets/imagescover/coreen4.png"),
      require("../../assets/imagescover/coreen5.png"),
    ],
  
    "turkish": [
      require("../../assets/imagescover/turkish.png"), 
      require("../../assets/imagescover/turkish2.png"),
      require("../../assets/imagescover/turkish3.png"),
      require("../../assets/imagescover/turkish4.png"),
      require("../../assets/imagescover/turkish5.png"),
    ],
  
    "grill": [
      require("../../assets/imagescover/grill.png"), 
      require("../../assets/imagescover/grill2.png"),
      require("../../assets/imagescover/grill3.png"),
      require("../../assets/imagescover/grill4.png"),
      require("../../assets/imagescover/grill5.png"),
    ],
  
    "patisserie": [
      require("../../assets/imagescover/patisserie.png"), 
      require("../../assets/imagescover/patisserie2.png"),
      require("../../assets/imagescover/patisserie3.png"),
      require("../../assets/imagescover/patisserie4.png"),
      require("../../assets/imagescover/patisserie5.png"),
    ],
  
    "europeen": [
      require("../../assets/imagescover/europeen.png"), 
      require("../../assets/imagescover/europeen2.png"),
      require("../../assets/imagescover/europeen3.png"),
      require("../../assets/imagescover/europeen4.png"),
      require("../../assets/imagescover/europeen5.png"),

    ],
  
    "fast_food": [
      require("../../assets/imagescover/fast_food.png"), 
      require("../../assets/imagescover/fast_food2.png"),
      require("../../assets/imagescover/fast_food3.png"),
      require("../../assets/imagescover/fast_food4.png"),
      require("../../assets/imagescover/fast_food5.png"),
    ],
  
    "africain": [
      require("../../assets/imagescover/africain.png"), 
      require("../../assets/imagescover/africain2.png"),
      require("../../assets/imagescover/africain3.png"),
      require("../../assets/imagescover/africain4.png"),
      require("../../assets/imagescover/africain5.png"),
    ],
  
    "bubble_tea": [
      require("../../assets/imagescover/bubble_tea.png"), 
      require("../../assets/imagescover/bubble_tea2.png"),
      require("../../assets/imagescover/bubble_tea3.png"),
      require("../../assets/imagescover/bubble_tea4.png"),
      require("../../assets/imagescover/bubble_tea5.png"),
    ],
  
    "fruits_de_mer": [
      require("../../assets/imagescover/fruits_de_mer.png"), 
      require("../../assets/imagescover/fruits_de_mer2.png"),
      require("../../assets/imagescover/fruits_de_mer3.png"),
      require("../../assets/imagescover/fruits_de_mer4.png"),
      require("../../assets/imagescover/fruits_de_mer5.png"),
    ],
  
    "americain": [
      require("../../assets/imagescover/americain.png"), 
      require("../../assets/imagescover/americain2.png"),
      require("../../assets/imagescover/americain3.png"),
      require("../../assets/imagescover/americain4.png"),
      require("../../assets/imagescover/americain5.png"),
    ],
  
    "divers": [
      require("../../assets/imagescover/divers.png"), 
      require("../../assets/imagescover/divers2.png")],
  
    "mediterranean": [
      require("../../assets/imagescover/mediterranean.png"), 
      require("../../assets/imagescover/mediterranean2.png"),
      require("../../assets/imagescover/mediterranean3.png"),
      require("../../assets/imagescover/mediterranean4.png"),
      require("../../assets/imagescover/mediterranean5.png"),
    ],
  
    "grec": [
      require("../../assets/imagescover/grec.png"), 
      require("../../assets/imagescover/grec2.png"),
      require("../../assets/imagescover/grec3.png"),
      require("../../assets/imagescover/grec4.png"),
      require("../../assets/imagescover/grec5.png"),
    ],
  
    "espagnol": [
      require("../../assets/imagescover/espagnol.png"), 
      require("../../assets/imagescover/espagnol2.png"),
      require("../../assets/imagescover/espagnol3.png"),
      require("../../assets/imagescover/espagnol4.png"),
      require("../../assets/imagescover/espagnol5.png"),
    ],
  
    "tacos": [
      require("../../assets/imagescover/tacos.png"), 
      require("../../assets/imagescover/tacos2.png"),
      require("../../assets/imagescover/tacos3.png"),
      require("../../assets/imagescover/tacos4.png"),
      require("../../assets/imagescover/tacos5.png"),
    ],
  
    "creole": [
      require("../../assets/imagescover/creole.png"), 
      require("../../assets/imagescover/creole2.png"),
      require("../../assets/imagescover/creole3.png"),
      require("../../assets/imagescover/creole4.png"),
      require("../../assets/imagescover/creole5.png"),
    ],
  
    "balkans": [
      require("../../assets/imagescover/balkans.png"), 
      require("../../assets/imagescover/balkans2.png"),
      require("../../assets/imagescover/balkans3.png"),
      require("../../assets/imagescover/balkans4.png"),
      require("../../assets/imagescover/balkans5.png"),
    ],
  
    "bar": [
      require("../../assets/imagescover/bar.png"), 
      require("../../assets/imagescover/bar2.png"),
      require("../../assets/imagescover/bar3.png"),
      require("../../assets/imagescover/bar4.png"),
      require("../../assets/imagescover/bar5.png"),
    ],
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

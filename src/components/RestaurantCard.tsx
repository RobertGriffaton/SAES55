import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";

// --- MAPPING DES IMAGES ---
// Les valeurs peuvent être soit une image unique, soit un TABLEAU d'images [ ]
const CATEGORY_IMAGES: Record<string, any> = {
  // --- MARQUES (Priorité Haute - Image Unique) ---
  "mcdonald's": require("../../assets/imagescover/mcdo.png"),
  "kfc": require("../../assets/imagescover/kfc.png"),
  "quick": require("../../assets/imagescover/quick.png"),
  "starbucks": require("../../assets/imagescover/starbucks.png"),
  "subway": require("../../assets/imagescover/subway.png"),
  "chicken_spot": require("../../assets/imagescover/chickenspot.png"),
  "burger_king": require("../../assets/imagescover/burgerking.png"),

  // --- CATÉGORIES AVEC VARIATIONS (Tableaux d'images) ---
  // Ajoutez autant de variantes que vous avez dans vos assets
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

interface RestaurantCardProps {
  restaurant: any;
  onPress: () => void;
}

export const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {

  // SÉCURITÉ : Anti-crash
  if (!restaurant) return null;

  const imageSource = useMemo(() => {
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
        // Cela garantit que le même restaurant a toujours la même image (pas de clignotement au scroll).
        if (Array.isArray(found)) {
            const nameToHash = restaurant.name || "default";
            let hash = 0;
            for (let i = 0; i < nameToHash.length; i++) {
                hash = nameToHash.charCodeAt(i) + ((hash << 5) - hash);
            }
            // Modulo pour avoir un index valide (0, 1, 2...)
            const index = Math.abs(hash) % found.length;
            return found[index];
        }
        
        // Si c'est une image unique
        return found;
      }
    }
    return null;
  }, [restaurant]);

  // Affichage propre des cuisines
  const displayCuisines = (restaurant.cuisines || restaurant.cuisine)
    ? (Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(" • ") : String(restaurant.cuisines).replace(/,/g, " • "))
    : (restaurant.type ? String(restaurant.type).replace(/_/g, " ") : "");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image 
            source={imageSource} 
            resizeMode="cover" 
            style={styles.coverImage} 
          />
        ) : (
          <View style={styles.placeholderContainer}>
             <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name || "Restaurant sans nom"}
          </Text>
        </View>

        <Text style={styles.details} numberOfLines={1}>
          {displayCuisines}
        </Text>

        <View style={styles.badgesRow}>
           <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.5 ★</Text>
           </View>

          {restaurant.vegetarian === 1 && (
            <View style={[styles.badge, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="leaf" size={12} color="green" />
              <Text style={[styles.badgeText, { color: "green" }]}>Végé</Text>
            </View>
          )}
          
          {restaurant.vegan === 1 && (
            <View style={[styles.badge, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="nutrition" size={12} color="green" />
              <Text style={[styles.badgeText, { color: "green" }]}>Vegan</Text>
            </View>
          )}
          
           {(restaurant.takeaway === 1 || restaurant.takeaway === "yes" || restaurant.takeaway === true) && (
            <View style={[styles.badge, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="basket" size={12} color="orange" />
              <Text style={[styles.badgeText, { color: "orange" }]}>Emporter</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20, 
    flexDirection: "column", 
    overflow: "hidden", 
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9, 
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primary || "#6200EE",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: { padding: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  name: { fontSize: 18, fontWeight: "bold", color: colors.text || "#000", flex: 1 },
  details: { fontSize: 14, color: "#666", marginBottom: 10, textTransform: 'capitalize' },
  badgesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, gap: 4 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  ratingBadge: { backgroundColor: "#f5f5f5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  ratingText: { fontSize: 12, fontWeight: "bold", color: "#333" },
});
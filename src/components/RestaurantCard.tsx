import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";

// --- MAPPING DES IMAGES ---
const CATEGORY_IMAGES: Record<string, any> = {
  "francais": require("../../assets/imagescover/francais.png"),
  "pizza": require("../../assets/imagescover/pizza.png"),
  "japonais": require("../../assets/imagescover/japonais.png"),
  "italien": require("../../assets/imagescover/italien.png"),
  "burger": require("../../assets/imagescover/burger.png"),
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
    if (restaurant?.cuisines) {
      candidates = [...candidates, ...String(restaurant.cuisines).split(",")];
    }
    if (restaurant?.type) {
      candidates.push(String(restaurant.type));
    }

    for (const rawKey of candidates) {
      const cleanKey = rawKey
        .trim()
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/-/g, "_");

      if (CATEGORY_IMAGES[cleanKey]) {
        return CATEGORY_IMAGES[cleanKey];
      }
    }
    return null;
  }, [restaurant]);

  // Textes sécurisés
  const displayCuisines = restaurant.cuisines
    ? String(restaurant.cuisines).replace(/,/g, " • ")
    : (restaurant.type ? String(restaurant.type).replace(/_/g, " ") : "");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* 1. SECTION IMAGE */}
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

      {/* 2. SECTION INFORMATIONS */}
      <View style={styles.contentContainer}>
        
        {/* Titre */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name || "Restaurant sans nom"}
          </Text>
        </View>

        {/* Cuisines */}
        <Text style={styles.details} numberOfLines={1}>
          {displayCuisines}
        </Text>

        {/* Badges */}
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
          
           {restaurant.takeaway === 1 && (
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
    
    // IMPORTANT pour le mode grille sur PC
    width: "100%",

    // Ombres
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
    // IMPORTANT : On utilise le ratio 16/9 au lieu d'une hauteur fixe
    // Ça permet d'avoir une belle image sur mobile ET sur PC (pas d'étirement moche)
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

  contentContainer: {
    padding: 12,
  },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text || "#000",
    flex: 1,
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textTransform: 'capitalize'
  },
  
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ratingBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
});
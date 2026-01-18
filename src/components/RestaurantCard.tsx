import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../styles/theme";

import { getRestaurantImage } from "../utils/ImageMapping";

interface RestaurantCardProps {
  restaurant: any;
  onPress: () => void;
}

export const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {

  // SÉCURITÉ : Anti-crash
  if (!restaurant) return null;

  const imageSource = useMemo(() => getRestaurantImage(restaurant), [restaurant]);

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